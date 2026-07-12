"use server";

import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { getElectionStatus } from "@/lib/election";
import { getElectionBySlug, requireElectionId } from "@/lib/election-context";

export async function publishResults(electionSlug: string) {
  const admin = await verifyAdminSession();
  if (!admin) {
    throw new Error("Unauthorized");
  }

  const electionRecord = await getElectionBySlug(electionSlug);
  const electionId = electionRecord.id;

  // Double check that the election is actually closed
  const election = await getElectionStatus(electionId);
  if (!election.isClosed) {
    throw new Error("Cannot publish results while the election is still open.");
  }

  // Update the config for this specific election
  await prisma.electionConfig.update({
    where: { electionId },
    data: {
      resultsPublished: true,
    },
  });

  revalidatePath(`/org/${electionRecord.organisation.slug}/admin/e/${electionSlug}`);
  revalidatePath(`/e/${electionSlug}/results`);

  return { success: true };
}
