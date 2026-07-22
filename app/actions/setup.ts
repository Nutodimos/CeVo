"use server";

import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";

async function verifySetupAccess(electionId: string) {
  const admin = await verifyAdminSession();
  if (!admin) return null;

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    include: { config: true }
  });
  
  if (!election) return null;

  if (admin.role !== "super_admin") {
    const orgMember = await prisma.orgMember.findFirst({
      where: {
        organisationId: election.organisationId,
        adminUserId: admin.adminId,
        role: "org_admin"
      }
    });
    if (!orgMember) return null;
  }

  return { admin, election };
}

export async function goLive(electionId: string) {
  const access = await verifySetupAccess(electionId);
  if (!access) return { success: false, error: "Unauthorized" };

  if (access.election.status !== "setup") {
    return { success: false, error: "Election is already live or closed" };
  }

  // Final verification
  const [voterCount, positionsCount, candidatesCount, config] = await Promise.all([
    prisma.voterRoll.count({ where: { electionId } }),
    prisma.position.count({ where: { electionId } }),
    prisma.candidate.count({ where: { position: { electionId } } }),
    prisma.electionConfig.findUnique({ where: { electionId } })
  ]);

  if (!voterCount || !positionsCount || !candidatesCount || !config || !config.previewedAt) {
    return { success: false, error: "Not all setup steps are complete." };
  }

  await prisma.election.update({
    where: { id: electionId },
    data: { status: "active" }
  });

  await logAudit(access.admin.adminId, "election.live", null, electionId);

  return { success: true };
}

export async function importVoterRoll(electionId: string, rows: any[], replace: boolean) {
  const access = await verifySetupAccess(electionId);
  if (!access || access.election.status !== "setup") return { success: false, error: "Unauthorized or locked" };

  try {
    if (replace) {
      await prisma.voterRoll.deleteMany({ where: { electionId } });
    }

    const dataToInsert = rows.map(r => ({
      electionId,
      matricNumber: r.matricNumber.trim().toUpperCase(),
      name: r.name.trim(),
      level: r.level.trim()
    }));

    // Avoid duplicates gracefully
    await prisma.voterRoll.createMany({
      data: dataToInsert,
      skipDuplicates: true
    });

    await logAudit(access.admin.adminId, "voterroll.imported", { count: rows.length, replace }, electionId);
    return { success: true };
  } catch (err: any) {
    console.error("importVoterRoll error:", err);
    return { success: false, error: "Failed to import voter roll. Check the file format and try again." };
  }
}

export async function deleteVoter(electionId: string, voterId: string) {
  const access = await verifySetupAccess(electionId);
  if (!access || access.election.status !== "setup") return { success: false, error: "Unauthorized or locked" };

  try {
    await prisma.voterRoll.delete({
      where: { id: voterId, electionId }
    });
    await logAudit(access.admin.adminId, "voter.deleted", { voterId }, electionId);
    return { success: true };
  } catch (err: any) {
    console.error("deleteVoter error:", err);
    return { success: false, error: "Failed to delete voter." };
  }
}

export async function deleteAllVoters(electionId: string) {
  const access = await verifySetupAccess(electionId);
  if (!access || access.election.status !== "setup") return { success: false, error: "Unauthorized or locked" };

  try {
    const result = await prisma.voterRoll.deleteMany({
      where: { electionId }
    });
    await logAudit(access.admin.adminId, "voter.deleted_all", { count: result.count }, electionId);
    return { success: true };
  } catch (err: any) {
    console.error("deleteAllVoters error:", err);
    return { success: false, error: "Failed to delete all voters." };
  }
}

export async function createPosition(electionId: string, title: string, required: boolean, allowedLevel?: string) {
  const access = await verifySetupAccess(electionId);
  if (!access || access.election.status !== "setup") return { success: false, error: "Unauthorized or locked" };

  try {
    const maxOrderPos = await prisma.position.findFirst({
      where: { electionId },
      orderBy: { order: 'desc' }
    });
    const order = maxOrderPos ? maxOrderPos.order + 1 : 0;

    await prisma.position.create({
      data: { electionId, title, required, allowedLevel: allowedLevel || null, order }
    });
    
    await logAudit(access.admin.adminId, "position.created", { title, required }, electionId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Failed to create position" };
  }
}

export async function updatePosition(electionId: string, positionId: string, title: string, required: boolean, allowedLevel?: string) {
  const access = await verifySetupAccess(electionId);
  if (!access || access.election.status !== "setup") return { success: false, error: "Unauthorized or locked" };

  try {
    await prisma.position.update({
      where: { id: positionId, electionId },
      data: { title, required, allowedLevel: allowedLevel || null }
    });
    await logAudit(access.admin.adminId, "position.updated", { positionId, title, required }, electionId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Failed to update position" };
  }
}

export async function deletePosition(electionId: string, positionId: string) {
  const access = await verifySetupAccess(electionId);
  if (!access || access.election.status !== "setup") return { success: false, error: "Unauthorized or locked" };

  try {
    // Relying on DB checks if candidates exist (or we manually checked in frontend)
    await prisma.position.delete({
      where: { id: positionId, electionId }
    });
    await logAudit(access.admin.adminId, "position.deleted", { positionId }, electionId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Failed to delete position. Ensure no candidates exist." };
  }
}

export async function reorderPositions(electionId: string, items: { id: string, order: number }[]) {
  const access = await verifySetupAccess(electionId);
  if (!access || access.election.status !== "setup") return { success: false, error: "Unauthorized or locked" };

  try {
    // prisma transaction
    await prisma.$transaction(
      items.map(item => 
        prisma.position.update({
          where: { id: item.id, electionId },
          data: { order: item.order }
        })
      )
    );
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Failed to reorder positions" };
  }
}

export async function createCandidate(electionId: string, positionId: string, name: string, photoUrl: string, manifesto: string) {
  const access = await verifySetupAccess(electionId);
  if (!access || access.election.status !== "setup") return { success: false, error: "Unauthorized or locked" };

  try {
    const maxOrderCand = await prisma.candidate.findFirst({
      where: { positionId },
      orderBy: { order: 'desc' }
    });
    const order = maxOrderCand ? maxOrderCand.order + 1 : 0;

    await prisma.candidate.create({
      data: { positionId, name, photoUrl: photoUrl || null, manifesto: manifesto || null, order }
    });
    
    await logAudit(access.admin.adminId, "candidate.created", { positionId, name }, electionId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Failed to create candidate" };
  }
}

export async function updateCandidate(electionId: string, candidateId: string, name: string, photoUrl: string, manifesto: string) {
  const access = await verifySetupAccess(electionId);
  if (!access || access.election.status !== "setup") return { success: false, error: "Unauthorized or locked" };

  try {
    // Scope to election via position — prevents cross-election candidate manipulation
    await prisma.candidate.update({
      where: { id: candidateId, position: { electionId } },
      data: { name, photoUrl: photoUrl || null, manifesto: manifesto || null }
    });
    await logAudit(access.admin.adminId, "candidate.updated", { candidateId, name }, electionId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Failed to update candidate" };
  }
}

export async function deleteCandidate(electionId: string, candidateId: string) {
  const access = await verifySetupAccess(electionId);
  if (!access || access.election.status !== "setup") return { success: false, error: "Unauthorized or locked" };

  try {
    // Scope to election via position — prevents cross-election candidate deletion
    await prisma.candidate.delete({
      where: { id: candidateId, position: { electionId } }
    });
    await logAudit(access.admin.adminId, "candidate.deleted", { candidateId }, electionId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Failed to delete candidate" };
  }
}

export async function reorderCandidates(electionId: string, positionId: string, items: { id: string, order: number }[]) {
  const access = await verifySetupAccess(electionId);
  if (!access || access.election.status !== "setup") return { success: false, error: "Unauthorized or locked" };

  try {
    await prisma.$transaction(
      items.map(item => 
        prisma.candidate.update({
          // Scope to positionId AND election via position to prevent cross-election manipulation
          where: { id: item.id, positionId, position: { electionId } },
          data: { order: item.order }
        })
      )
    );
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Failed to reorder candidates" };
  }
}

export async function updateElectionConfig(electionId: string, data: { description: string, opensAt: Date, closesAt: Date, resultsVisibility: string, adminContact?: string }) {
  const access = await verifySetupAccess(electionId);
  if (!access || access.election.status !== "setup") return { success: false, error: "Unauthorized or locked" };

  try {
    // Update Election description
    await prisma.election.update({
      where: { id: electionId },
      data: { description: data.description }
    });

    // Upsert Config
    await prisma.electionConfig.upsert({
      where: { electionId },
      create: {
        electionId,
        opensAt: data.opensAt,
        closesAt: data.closesAt,
        resultsVisibility: data.resultsVisibility,
        adminContact: data.adminContact || null
      },
      update: {
        opensAt: data.opensAt,
        closesAt: data.closesAt,
        resultsVisibility: data.resultsVisibility,
        adminContact: data.adminContact || null
      }
    });

    await logAudit(access.admin.adminId, "config.updated", { opensAt: data.opensAt, closesAt: data.closesAt, resultsVisibility: data.resultsVisibility, adminContact: data.adminContact }, electionId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Failed to update configuration" };
  }
}

export async function markPreviewed(electionId: string) {
  const access = await verifySetupAccess(electionId);
  if (!access || access.election.status !== "setup") return { success: false };

  try {
    await prisma.electionConfig.update({
      where: { electionId },
      data: { previewedAt: new Date() }
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}
