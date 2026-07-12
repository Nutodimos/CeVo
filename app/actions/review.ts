"use server";

import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { getElectionBySlug, requireElectionId } from "@/lib/election-context";

export async function approveVote(pendingVoteId: string, electionSlug: string) {
  const admin = await verifyAdminSession();
  if (!admin) {
    throw new Error("Unauthorized");
  }

  const electionRecord = await getElectionBySlug(electionSlug);
  const electionId = electionRecord.id;

  try {
    // Defense in depth: verify the vote belongs to this election
    await prisma.pendingVote.update({
      where: { id: pendingVoteId, electionId },
      data: {
        status: "verified",
        reviewedBy: admin.email,
        reviewedAt: new Date(),
      },
    });

    revalidatePath(`/org/${electionRecord.organisation.slug}/admin/e/${electionSlug}/review`);
    return { success: true };
  } catch (err) {
    console.error("Failed to approve vote:", err);
    return { success: false, error: "Database error" };
  }
}

export async function rejectVote(pendingVoteId: string, electionSlug: string) {
  const admin = await verifyAdminSession();
  if (!admin) {
    throw new Error("Unauthorized");
  }

  const electionRecord = await getElectionBySlug(electionSlug);
  const electionId = electionRecord.id;

  try {
    // Defense in depth: verify the vote belongs to this election
    await prisma.pendingVote.update({
      where: { id: pendingVoteId, electionId },
      data: {
        status: "rejected",
        reviewedBy: admin.email,
        reviewedAt: new Date(),
      },
    });

    // We do NOT update VoterRoll.hasVoted to false because they are still
    // marked as having voted if they completed the ballot step, but wait —
    // in Phase 2: "transactional submission: writes choices -> flips status to pending_ocr -> marks voter as voted".
    // Wait, the prompt says:
    // "Reject -> PendingVote.status = 'rejected'. Do not touch VoterRoll.hasVoted — it should still be false, since this voter has not successfully cast a counted vote and may need to retry before polls close."
    // Ah, wait. If in Phase 2 it marked VoterRoll.hasVoted = true, then if we reject, and they need to retry, they can't retry unless hasVoted is false.
    // Let me check what the prompt exactly said:
    // "Do not touch VoterRoll.hasVoted — it should still be false, since this voter has not successfully cast a counted vote and may need to retry before polls close."
    // Wait, if it should STILL be false, maybe Phase 2 DID NOT set it to true? Let me check Phase 2 submission.
    revalidatePath(`/org/${electionRecord.organisation.slug}/admin/e/${electionSlug}/review`);
    return { success: true };
  } catch (err) {
    console.error("Failed to reject vote:", err);
    return { success: false, error: "Database error" };
  }
}
