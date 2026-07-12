import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import * as bcrypt from "bcryptjs";

// Crash fast on startup if the secret is missing or still set to the known-weak default.
const rawSecret = process.env.SESSION_SECRET;
if (!rawSecret || rawSecret.length < 32) {
  throw new Error(
    "FATAL: SESSION_SECRET environment variable is not set or is shorter than 32 characters. " +
    "Generate one with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
  );
}
const key = new TextEncoder().encode(rawSecret);

const ADMIN_COOKIE = "admin_session";
const ADMIN_SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

type AdminPayload = {
  adminId: string;
  email: string;
  role: string;
};

export async function createAdminSession(admin: AdminPayload): Promise<void> {
  const expires = new Date(Date.now() + ADMIN_SESSION_DURATION_MS);

  const token = await new SignJWT({ ...admin })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(key);

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
}

export async function verifyAdminSession(): Promise<AdminPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

/**
 * Verifies that the current session is for a super_admin.
 * Re-checks the role from the database to ensure a recently demoted admin
 * cannot continue to use their old JWT to access super_admin routes.
 */
export async function verifySuperAdminSession(): Promise<AdminPayload | null> {
  const payload = await verifyAdminSession();
  if (!payload) return null;

  // Re-verify role from DB — do not trust the JWT claim alone for privilege checks.
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: payload.adminId },
    select: { role: true },
  });

  if (!adminUser || adminUser.role !== "super_admin") {
    return null;
  }

  // Return with the DB-authoritative role
  return { ...payload, role: adminUser.role };
}


export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function loginAdmin(email: string, password?: string): Promise<{ success: boolean; error?: string; role?: string }> {
  if (!password) {
    return { success: false, error: "Password is required." };
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!admin) {
    return { success: false, error: "Invalid email or password." };
  }

  if (!admin.password) {
    return { success: false, error: "Please set up your password first via the link sent to your email." };
  }

  const isValidPassword = await bcrypt.compare(password, admin.password);
  if (!isValidPassword) {
    return { success: false, error: "Invalid email or password." };
  }

  await createAdminSession({
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  });

  return { success: true, role: admin.role };
}
