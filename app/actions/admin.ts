"use server";

import { loginAdmin, destroyAdminSession, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createPasswordSetupToken, validatePasswordSetupToken } from "@/lib/passwordSetupToken";
import { sendEmail } from "@/lib/email";
import * as bcrypt from "bcryptjs";

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

export async function updateProfile(prevState: unknown, formData: FormData) {
  const admin = await verifyAdminSession();
  if (!admin) return { error: "Unauthorized" };

  const name = formData.get("name")?.toString().trim();
  const avatarUrl = formData.get("avatarUrl")?.toString().trim();

  if (!name) return { error: "Name is required." };

  try {
    await prisma.adminUser.update({
      where: { id: admin.adminId },
      data: { name, avatarUrl: avatarUrl || null },
    });
    return { success: true };
  } catch (error) {
    console.error("Profile update error:", error);
    return { error: "Failed to update profile." };
  }
}

// Password Policy: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;

export async function requestPasswordReset(prevState: unknown, formData: FormData) {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  const user = await prisma.adminUser.findUnique({ where: { email } });
  
  if (user) {
    const rawToken = await createPasswordSetupToken(user.id);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/auth/set-password?token=${rawToken}`;
    await sendEmail({
      to: email,
      subject: `Password Reset Request`,
      text: `You requested a password reset. Please set your new password here: ${resetLink}`,
      html: `<p>You requested a password reset.</p><p><a href="${resetLink}">Click here to set your new password</a></p>`
    });
  }

  // Always return success to prevent email enumeration
  return { success: true, message: "If an account with that email exists, we've sent password reset instructions." };
}

export async function setPassword(prevState: unknown, formData: FormData) {
  const token = formData.get("token")?.toString();
  const password = formData.get("password")?.toString();

  if (!token || !password) return { error: "Token and password are required." };

  if (!PASSWORD_REGEX.test(password)) {
    return { error: "Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character." };
  }

  const tokenRecord = await validatePasswordSetupToken(token);
  if (!tokenRecord) {
    return { error: "Invalid or expired link. Please request a new one." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updatedUser = await tx.adminUser.update({
        where: { id: tokenRecord.userId },
        data: { password: hashedPassword }
      });

      await tx.passwordSetupToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() }
      });

      return updatedUser;
    });

    // Automatically log them in
    await loginAdmin(user.email, password);
    
    return { success: true };
  } catch (err) {
    console.error("Set password error:", err);
    return { error: "Failed to set password." };
  }
}

export async function changePassword(prevState: unknown, formData: FormData) {
  const admin = await verifyAdminSession();
  if (!admin) return { error: "Unauthorized" };

  const currentPassword = formData.get("currentPassword")?.toString();
  const newPassword = formData.get("newPassword")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  if (!currentPassword || !newPassword || !confirmPassword) return { error: "All fields are required." };
  if (newPassword !== confirmPassword) return { error: "New passwords do not match." };
  if (!PASSWORD_REGEX.test(newPassword)) return { error: "New password does not meet requirements." };

  const user = await prisma.adminUser.findUnique({ where: { id: admin.adminId } });
  if (!user || !user.password) return { error: "Invalid user state." };

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) return { error: "Incorrect current password." };

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  try {
    await prisma.adminUser.update({
      where: { id: admin.adminId },
      data: { password: hashedNewPassword }
    });
    return { success: true };
  } catch (error) {
    console.error("Change password error:", error);
    return { error: "Failed to change password." };
  }
}

