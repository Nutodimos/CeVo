"use server";

import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

/**
 * Verify that the current user is an org_admin for the given org.
 * Super admins automatically pass.
 */
async function verifyOrgAccess(orgSlug: string) {
  const admin = await verifyAdminSession();
  if (!admin) return null;

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug } });
  if (!org) return null;

  if (admin.role === "super_admin") {
    return { admin, org, role: "org_admin" as const };
  }

  const membership = await prisma.orgMember.findUnique({
    where: { organisationId_adminUserId: { organisationId: org.id, adminUserId: admin.adminId } }
  });

  if (!membership) return null;

  return { admin, org, role: membership.role };
}

export async function updateOrgBranding(
  orgSlug: string,
  data: { logoUrl?: string; primaryColor?: string; accentColor?: string; contactEmail?: string; name?: string; shortName?: string }
) {
  const access = await verifyOrgAccess(orgSlug);
  if (!access || access.role !== "org_admin") return { success: false, error: "Unauthorized" };

  await prisma.organisation.update({
    where: { id: access.org.id },
    data: {
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
      ...(data.primaryColor !== undefined && { primaryColor: data.primaryColor }),
      ...(data.accentColor !== undefined && { accentColor: data.accentColor }),
      ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.shortName !== undefined && { shortName: data.shortName }),
    }
  });

  await logAudit(access.admin.adminId, "org.branding_updated", data, null, access.org.id);
  revalidatePath(`/org/${orgSlug}`);
  return { success: true };
}

export async function createElectionAsOrgAdmin(orgSlug: string, name: string, slug: string, description?: string) {
  const access = await verifyOrgAccess(orgSlug);
  if (!access || access.role !== "org_admin") return { success: false, error: "Unauthorized" };

  if (!name || !slug) return { success: false, error: "Name and slug are required" };
  if (!/^[a-z0-9-]+$/.test(slug)) return { success: false, error: "Invalid slug format" };

  const existing = await prisma.election.findUnique({ where: { slug } });
  if (existing) return { success: false, error: "This slug is already taken" };

  try {
    const election = await prisma.election.create({
      data: {
        name,
        slug,
        description: description || null,
        organisationId: access.org.id,
        createdBy: access.admin.adminId,
        config: {
          create: {
            opensAt: new Date(),
            closesAt: new Date(),
          }
        }
      }
    });

    await logAudit(access.admin.adminId, "election.created", { name, slug }, election.id, access.org.id);
    return { success: true, slug: election.slug };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to create election" };
  }
}

export async function inviteOrgMember(orgSlug: string, email: string, role: string) {
  const access = await verifyOrgAccess(orgSlug);
  if (!access || access.role !== "org_admin") return { success: false, error: "Unauthorized" };

  email = email.toLowerCase().trim();

  const existingUser = await prisma.adminUser.findUnique({ where: { email } });
  if (existingUser) {
    try {
      await prisma.orgMember.create({
        data: {
          organisationId: access.org.id,
          adminUserId: existingUser.id,
          role,
        }
      });
      await logAudit(access.admin.adminId, "org_member.invited", { email, role, type: "direct" }, null, access.org.id);
      return { success: true, message: `Added ${existingUser.name} directly.` };
    } catch (e: unknown) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as {code: string}).code === 'P2002') {
        return { success: false, error: "User is already a member of this organisation" };
      }
      return { success: false, error: "Failed to add member" };
    }
  }

  return { success: false, error: "User does not have a CeVo account. They must be invited to an election first to create an account." };
}

export async function removeOrgMember(orgSlug: string, memberId: string) {
  const access = await verifyOrgAccess(orgSlug);
  if (!access || access.role !== "org_admin") return { success: false, error: "Unauthorized" };

  const count = await prisma.orgMember.count({ where: { organisationId: access.org.id, role: "org_admin" } });
  const target = await prisma.orgMember.findUnique({ where: { id: memberId } });

  if (target?.role === "org_admin" && count <= 1) {
    return { success: false, error: "Cannot remove the last org admin." };
  }

  await prisma.orgMember.delete({ where: { id: memberId } });
  await logAudit(access.admin.adminId, "org_member.removed", { targetId: target?.adminUserId }, null, access.org.id);
  return { success: true };
}
