"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { verifyAdminSession } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { getElectionBySlug, requireElectionId } from "@/lib/election-context";

export async function runTallyJob(electionSlug: string) {
  const admin = await verifyAdminSession();
  if (!admin) {
    throw new Error("Unauthorized");
  }

  const electionRecord = await getElectionBySlug(electionSlug);
  const electionId = electionRecord.id;

  // 1. Fetch verified rows that haven't been tallied (choices still present)
  const pendingVotes = await prisma.pendingVote.findMany({
    where: {
      electionId,
      status: "verified",
      NOT: { choices: { equals: Prisma.DbNull } },
    },
  });

  if (pendingVotes.length === 0) {
    return { success: true, processed: 0, skipped: 0 };
  }

  let processedCount = 0;
  let skippedCount = 0;

  for (const pv of pendingVotes) {
    try {
      // Execute the row in a single transaction
      await prisma.$transaction(async (tx) => {
        // a) Safety check: has the user already voted?
        const voter = await tx.voterRoll.findUnique({
          where: { electionId_matricNumber: { electionId, matricNumber: pv.matricNumber } },
        });

        // Double check they exist and haven't already been marked as voted
        if (!voter || voter.hasVoted) {
          skippedCount++;
          return;
        }

        // b) Parse choices and prepare Vote records
        // choices is expected to be { "positionId": "candidateId" }
        const choices = pv.choices as Record<string, string> | null;
        if (!choices || typeof choices !== "object") {
          throw new Error("Invalid choices payload");
        }

        const voteRecords = Object.entries(choices).map(([positionId, candidateId]) => ({
          electionId,
          positionId,
          candidateId,
          voterLevel: voter.level, // Transfer demographic data securely
        }));

        // Insert anonymous Vote rows
        await tx.vote.createMany({
          data: voteRecords,
        });

        // c) Mark the voter as having successfully voted
        await tx.voterRoll.update({
          where: { electionId_matricNumber: { electionId, matricNumber: pv.matricNumber } },
          data: { hasVoted: true },
        });

        // d) Archive the PendingVote and strip the choices to anonymize
        await tx.pendingVote.update({
          where: { id: pv.id },
          data: {
            status: "archived",
            choices: Prisma.DbNull, // Critical: this severs the ballot from the identity
          },
        });

        processedCount++;
      });
    } catch (err) {
      console.error(`Failed to process PendingVote ${pv.id}:`, err);
      // The transaction will roll back for this specific row, 
      // preventing half-anonymized data. We continue to the next row.
    }
  }

  revalidatePath(`/org/${electionRecord.organisation.slug}/admin/e/${electionSlug}`);
  return {
    success: true,
    processed: processedCount,
    skipped: skippedCount,
  };
}
