import { prisma } from "./prisma";
import crypto from "crypto";

export async function createPasswordSetupToken(userId: string): Promise<string> {
  // Invalidate any existing unused tokens for this user
  await prisma.passwordSetupToken.updateMany({
    where: { 
      userId, 
      usedAt: null, 
      expiresAt: { gt: new Date() } 
    },
    data: { 
      expiresAt: new Date() // Expire immediately
    }
  });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now

  await prisma.passwordSetupToken.create({
    data: {
      token: hashedToken,
      userId,
      expiresAt,
    },
  });

  return rawToken;
}

export async function validatePasswordSetupToken(rawToken: string) {
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  
  const tokenRecord = await prisma.passwordSetupToken.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });

  if (!tokenRecord) return null;
  if (tokenRecord.usedAt !== null) return null;
  if (tokenRecord.expiresAt < new Date()) return null;

  return tokenRecord;
}
