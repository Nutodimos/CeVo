"use server";

import { prisma } from "@/lib/prisma";
import { createVoterSession, updateVoterSession, verifyVoterSession } from "@/lib/session";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getElectionStatus } from "@/lib/election";


export type VoterCheckResult = {
  success: boolean;
  error?: string;
};

export async function checkMatricNumber(
  _prevState: VoterCheckResult | null,
  formData: FormData
): Promise<VoterCheckResult> {
  const matricNumber = formData.get("matricNumber")?.toString().trim().toUpperCase();
  const electionId = formData.get("electionId")?.toString();
  const electionSlug = formData.get("electionSlug")?.toString();

  if (!matricNumber) {
    return { success: false, error: "Please enter your matric number." };
  }

  if (!electionId || !electionSlug) {
    return { success: false, error: "Election context is missing. Please reload the page." };
  }

  // Election window check
  const election = await getElectionStatus(electionId);
  if (!election.isOpen) {
    if (election.isClosed) {
      return { success: false, error: "Voting has officially closed." };
    } else {
      return { success: false, error: "Voting is not currently open." };
    }
  }

  // Rate limit check
  const headersList = await headers();
  const clientIP = getClientIP(headersList);
  const rateLimitResult = checkRateLimit(`matric-check:${clientIP}`);

  if (!rateLimitResult.allowed) {
    const resetIn = Math.ceil((rateLimitResult.resetAt - Date.now()) / 60000);
    return {
      success: false,
      error: `Too many attempts. Please try again in ${resetIn} minute${resetIn > 1 ? "s" : ""}.`,
    };
  }

  // Lookup voter — uses composite unique [electionId, matricNumber]
  const voter = await prisma.voterRoll.findUnique({
    where: { electionId_matricNumber: { electionId, matricNumber } },
  });

  if (!voter) {
    return {
      success: false,
      error: "We couldn't verify this matric number. Please check and try again.",
    };
  }

  // Already voted — redirect to receipt
  if (voter.hasVoted) {
    await createVoterSession({
      matricNumber: voter.matricNumber,
      electionId,
      electionSlug,
      phase: "receipt",
    });
    redirect(`/e/${electionSlug}/receipt`);
  }

  // Valid and hasn't voted — redirect to capture
  await createVoterSession({
    matricNumber: voter.matricNumber,
    electionId,
    electionSlug,
    phase: "capture",
  });
  redirect(`/e/${electionSlug}/capture`);
}

export async function submitCapture(
  cardPhotoUrl: string,
  captureWidth?: number,
  captureHeight?: number
): Promise<{ success: boolean; error?: string }> {
  const session = await verifyVoterSession();

  if (!session || session.phase !== "capture") {
    return { success: false, error: "Invalid or expired session. Please start over." };
  }

  // Election window check
  const election = await getElectionStatus(session.electionId);
  if (!election.isOpen) {
    return { success: false, error: "Voting is closed." };
  }

  // Create PendingVote — scoped to election
  const pendingVote = await prisma.pendingVote.create({
    data: {
      electionId: session.electionId,
      matricNumber: session.matricNumber,
      cardPhotoUrl,
      captureWidth,
      captureHeight,
      status: "awaiting_ballot",
    },
  });

  // Update session with pendingVoteId and advance phase
  await updateVoterSession({
    pendingVoteId: pendingVote.id,
    phase: "ballot",
  });

  return { success: true };
}
