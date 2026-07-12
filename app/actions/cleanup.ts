"use server";

import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin-auth";
import { deleteCardPhoto } from "@/lib/storage";
import { requireElectionId } from "@/lib/election-context";

export async function runCleanupJob(electionSlug: string) {
  const admin = await verifyAdminSession();
  if (!admin) {
    throw new Error("Unauthorized");
  }

  const electionId = await requireElectionId(electionSlug);

  // Calculate the cutoff date (24 hours ago)
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Fetch archived rows older than 24 hours for this election
  const staleRows = await prisma.pendingVote.findMany({
    where: {
      electionId,
      status: "archived",
      updatedAt: {
        lt: cutoff,
      },
    },
  });

  if (staleRows.length === 0) {
    return { success: true, processed: 0, failed: 0 };
  }

  let processedCount = 0;
  let failedCount = 0;

  for (const row of staleRows) {
    try {
      // 1. Delete the photo from storage first
      // (If this succeeds but DB fails, we just have a missing photo log, which is fine for retention cleanup)
      if (row.cardPhotoUrl) {
        await deleteCardPhoto(row.cardPhotoUrl);
      }

      // 2. Delete the row from the database
      await prisma.pendingVote.delete({
        where: { id: row.id },
      });

      processedCount++;
    } catch (err) {
      console.error(`Failed to cleanup PendingVote ${row.id}:`, err);
      failedCount++;
    }
  }

  return {
    success: true,
    processed: processedCount,
    failed: failedCount,
  };
}
