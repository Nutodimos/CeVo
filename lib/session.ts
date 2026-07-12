import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Crash fast on startup if the secret is missing or still set to the known-weak default.
// This prevents silent fallback to a publicly-known value in production.
const rawSecret = process.env.SESSION_SECRET;
if (!rawSecret || rawSecret.length < 32) {
  throw new Error(
    "FATAL: SESSION_SECRET environment variable is not set or is shorter than 32 characters. " +
    "Generate one with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
  );
}
const key = new TextEncoder().encode(rawSecret);

const COOKIE_NAME = "voter_session";
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export type VoterSessionPayload = {
  matricNumber: string;
  electionId: string;
  electionSlug: string;
  pendingVoteId?: string;
  phase: "capture" | "ballot" | "receipt";
  iat?: number;
  exp?: number;
};

export async function createVoterSession(
  payload: Omit<VoterSessionPayload, "iat" | "exp">
): Promise<void> {
  const expires = new Date(Date.now() + SESSION_DURATION_MS);

  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(key);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
}

export async function verifyVoterSession(): Promise<VoterSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as VoterSessionPayload;
  } catch {
    return null;
  }
}

export async function destroyVoterSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function updateVoterSession(
  updates: Partial<Omit<VoterSessionPayload, "iat" | "exp">>
): Promise<void> {
  const current = await verifyVoterSession();
  if (!current) throw new Error("No active session to update");

  await createVoterSession({
    matricNumber: current.matricNumber,
    electionId: current.electionId,
    electionSlug: current.electionSlug,
    pendingVoteId: current.pendingVoteId,
    phase: current.phase,
    ...updates,
  });
}
