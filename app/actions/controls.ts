"use server";

import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";

export async function stopElection(electionId: string) {
  const admin = await verifyAdminSession();
  if (!admin) return { success: false, error: "Unauthorized" };

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    include: { config: true }
  });
  if (!election || election.status !== "active") {
    return { success: false, error: "Election is not active." };
  }

  if (admin.role !== "super_admin") {
    const orgMember = await prisma.orgMember.findFirst({
      where: {
        organisationId: election.organisationId,
        adminUserId: admin.adminId,
        role: "org_admin"
      }
    });
    if (!orgMember) return { success: false, error: "Unauthorized" };
  }

  const now = new Date();
  
  await prisma.election.update({
    where: { id: electionId },
    data: { status: "closed" }
  });

  if (election.config && election.config.closesAt > now) {
    await prisma.electionConfig.update({
      where: { electionId },
      data: { closesAt: now }
    });
  }

  // Turnout at close
  const [total, voted] = await Promise.all([
    prisma.voterRoll.count({ where: { electionId } }),
    prisma.voterRoll.count({ where: { electionId, hasVoted: true } })
  ]);

  await logAudit(admin.adminId, "election.closed", { turnout: { total, voted } }, electionId);

  // If auto-publish is on, publish results immediately
  if (election.config?.resultsVisibility === "auto" && !election.config.resultsPublished) {
    // Wait, anonymization must run BEFORE publishing. 
    // If it's auto-published, does the tally job run automatically? 
    // In this MVP, Phase 5 states anonymization is a manual job run by the admin.
    // So "auto" publish only means it automatically shows IF the tally is run.
    // Or we just flag it, but the tally still must be run.
    // Let's leave `resultsPublished` alone until anonymization is done, or set it to true if anonymization was somehow 0.
    // Usually, auto-publish just means the cron job would publish it. We'll let the PostCloseDashboard handle the manual trigger of tally, and then that trigger checks if it should publish.
  }

  return { success: true };
}

export async function reopenElection(electionId: string, newClosesAt: Date) {
  const admin = await verifyAdminSession();
  if (!admin || admin.role !== "super_admin") {
    return { success: false, error: "Super admin access required." };
  }

  const election = await prisma.election.findUnique({
    where: { id: electionId }
  });
  if (!election || election.status !== "closed") {
    return { success: false, error: "Election must be closed to reopen it." };
  }

  await prisma.election.update({
    where: { id: electionId },
    data: { status: "active" }
  });

  await prisma.electionConfig.update({
    where: { electionId },
    data: { closesAt: newClosesAt }
  });

  await logAudit(admin.adminId, "election.reopened", { newClosesAt }, electionId);

  return { success: true };
}
