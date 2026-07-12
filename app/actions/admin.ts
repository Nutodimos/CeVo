"use server";

import { loginAdmin, destroyAdminSession, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export type AdminLoginResult = {
  success: boolean;
  error?: string;
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function adminLogin(
  _prevState: AdminLoginResult | null,
  formData: FormData
): Promise<AdminLoginResult> {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { success: false, error: "Please enter your email and password." };
  }

  // Rate limit by IP + email combination
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown";
  const rateLimitKey = `admin_login:${ip}:${email}`;
  const now = new Date();

  try {
    const rl = await prisma.rateLimit.findUnique({ where: { ip: rateLimitKey } });

    if (rl && rl.resetAt > now) {
      if (rl.attempts >= MAX_LOGIN_ATTEMPTS) {
        const resetInMin = Math.ceil((rl.resetAt.getTime() - now.getTime()) / 60000);
        return {
          success: false,
          error: `Too many login attempts. Try again in ${resetInMin} minute${resetInMin > 1 ? "s" : ""}.`,
        };
      }
      await prisma.rateLimit.update({
        where: { ip: rateLimitKey },
        data: { attempts: rl.attempts + 1 },
      });
    } else {
      // Create or reset the window
      await prisma.rateLimit.upsert({
        where: { ip: rateLimitKey },
        create: { ip: rateLimitKey, attempts: 1, resetAt: new Date(now.getTime() + LOGIN_WINDOW_MS) },
        update: { attempts: 1, resetAt: new Date(now.getTime() + LOGIN_WINDOW_MS) },
      });
    }
  } catch {
    // Non-fatal — continue without rate limiting if DB fails
    console.error("Rate limit DB error during admin login");
  }

  const result = await loginAdmin(email, password);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // On success, clear the rate limit counter
  try {
    await prisma.rateLimit.deleteMany({ where: { ip: rateLimitKey } });
  } catch { /* non-fatal */ }

  // Determine where to redirect based on role hierarchy
  if (result.role === "super_admin") {
    redirect("/superadmin");
  }

  // Check if user is an org member — redirect to their org dashboard
  const adminUser = await prisma.adminUser.findUnique({ where: { email } });
  if (adminUser) {
    const orgMembership = await prisma.orgMember.findFirst({
      where: { adminUserId: adminUser.id },
      include: { organisation: true },
      orderBy: { createdAt: "asc" },
    });

    if (orgMembership) {
      redirect(`/org/${orgMembership.organisation.slug}/admin`);
    }

    // Check if user has any election admin assignments — redirect to that election
    const electionAdmin = await prisma.electionAdmin.findFirst({
      where: { adminUserId: adminUser.id },
      include: { election: { include: { organisation: true } } },
      orderBy: { createdAt: "asc" },
    });

    if (electionAdmin) {
      redirect(`/org/${electionAdmin.election.organisation.slug}/admin/e/${electionAdmin.election.slug}`);
    }
  }

  // Fallback — no assignments
  redirect("/admin");
}

export async function adminLogout(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}
