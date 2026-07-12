"use server";

import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export type EligibilityCheckResult = {
  success: boolean;
  status?: "found_unvoted" | "found_voted" | "not_found";
  message?: string;
  adminContact?: string | null;
  error?: string;
};

export async function checkEligibility(
  prevState: EligibilityCheckResult | null,
  formData: FormData
): Promise<EligibilityCheckResult> {
  const electionId = formData.get("electionId") as string;
  const rawMatric = formData.get("matricNumber") as string;

  if (!electionId || !rawMatric || rawMatric.trim() === "") {
    return { success: false, error: "Please provide a valid matriculation number." };
  }

  const matricNumber = rawMatric.trim().toUpperCase();

  // 1. Extract IP and apply Rate Limiting
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  const rateLimitKey = `eligibility_check:${ip}`;

  try {
    const now = new Date();
    const rateLimit = await prisma.rateLimit.findUnique({
      where: { ip: rateLimitKey }
    });

    if (rateLimit) {
      if (rateLimit.resetAt > now) {
        if (rateLimit.attempts >= 5) {
          return { success: false, error: "Too many checks. Please try again in 10 minutes." };
        }
        // Increment attempts
        await prisma.rateLimit.update({
          where: { ip: rateLimitKey },
          data: { attempts: rateLimit.attempts + 1 }
        });
      } else {
        // Expired, reset
        await prisma.rateLimit.update({
          where: { ip: rateLimitKey },
          data: { attempts: 1, resetAt: new Date(now.getTime() + 10 * 60 * 1000) }
        });
      }
    } else {
      // First attempt
      await prisma.rateLimit.create({
        data: {
          ip: rateLimitKey,
          attempts: 1,
          resetAt: new Date(now.getTime() + 10 * 60 * 1000)
        }
      });
    }

    // 2. Lookup Voter Roll
    const voter = await prisma.voterRoll.findUnique({
      where: {
        electionId_matricNumber: {
          electionId,
          matricNumber
        }
      }
    });

    if (!voter) {
      const config = await prisma.electionConfig.findUnique({
        where: { electionId },
        select: { adminContact: true }
      });
      return { 
        success: true, 
        status: "not_found", 
        message: "Your matric number was not found on the voter roll. Please contact the electoral committee to resolve this.",
        adminContact: config?.adminContact
      };
    }

    if (voter.hasVoted) {
      return {
        success: true,
        status: "found_voted",
        message: "You have already cast your vote in this election."
      };
    }

    return {
      success: true,
      status: "found_unvoted",
      message: "You are registered to vote in this election!"
    };

  } catch (err: any) {
    console.error("Eligibility check error:", err);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
