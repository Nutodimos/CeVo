"use server";

import { prisma } from "@/lib/prisma";
import { verifyVoterSession, destroyVoterSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getElectionStatus } from "@/lib/election";

export type BallotSubmissionResult = {
  success: boolean;
  error?: string;
};

import { processVoteVerification } from "@/lib/verification";

export async function submitBallot(
  choices: Record<string, string>
): Promise<BallotSubmissionResult> {
  const session = await verifyVoterSession();

  if (!session || session.phase !== "ballot" || !session.pendingVoteId) {
    return { success: false, error: "Invalid or expired session. Please start over." };
  }

  // Election window check
  const election = await getElectionStatus(session.electionId);
  if (!election.isOpen) {
    return { success: false, error: "Voting is closed." };
  }

  // Verify PendingVote exists and is in correct state
  const pendingVote = await prisma.pendingVote.findUnique({
    where: { id: session.pendingVoteId },
  });

  if (!pendingVote || pendingVote.status !== "awaiting_ballot") {
    return { success: false, error: "This voting session is no longer valid." };
  }

  // Defense in depth: verify the pending vote belongs to this election
  if (pendingVote.electionId !== session.electionId) {
    return { success: false, error: "Election mismatch. Please start over." };
  }

  // Validate that all position IDs are real AND belong to this election
  const positionIds = Object.keys(choices);

  const positions = await prisma.position.findMany({
    where: { id: { in: positionIds }, electionId: session.electionId },
    include: { candidates: true },
  });

  if (positions.length !== positionIds.length) {
    return { success: false, error: "Invalid selection detected." };
  }

  // Verify each candidate belongs to the correct position
  for (const position of positions) {
    const selectedCandidateId = choices[position.id];
    const validCandidate = position.candidates.find(
      (c: (typeof positions)[number]["candidates"][number]) => c.id === selectedCandidateId
    );
    if (!validCandidate) {
      return { success: false, error: "Invalid candidate selection detected." };
    }
  }

  // Write choices and flip status — all in a transaction
  await prisma.$transaction([
    // Update PendingVote with choices
    prisma.pendingVote.update({
      where: { id: session.pendingVoteId },
      data: {
        choices: choices,
        status: "pending_ocr",
      },
    }),
  ]);

  // Trigger Gemini verification in the background
  processVoteVerification(session.pendingVoteId).catch(console.error);

  // Destroy session — can't be reused
  await destroyVoterSession();

  redirect(`/e/${session.electionSlug}/confirmation`);
}
