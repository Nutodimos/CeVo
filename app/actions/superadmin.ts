"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { verifySuperAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import crypto from "crypto";
import * as bcrypt from "bcryptjs";
import { logAudit } from "@/lib/audit";
import { createPasswordSetupToken } from "@/lib/passwordSetupToken";
import { sendEmail } from "@/lib/email";

// ============================================
// ELECTION ACTIONS
// ============================================

export async function deleteElection(electionId: string) {
  const admin = await verifySuperAdminSession();
  if (!admin) return { error: "Unauthorized" };

  try {
    // Delete the election (Prisma cascade will handle positions, candidates, votes if configured, 
    // otherwise we might need to manually delete dependencies if no cascade)
    // Assuming cascade is set up in schema. If not, Prisma will throw.
    await prisma.election.delete({
      where: { id: electionId }
    });
    
    await logAudit(admin.adminId, "ELECTION_DELETED", { electionId });
    return { success: true };
  } catch (error: any) {
    console.error("Delete election error:", error);
    return { error: "Failed to delete election. It may have dependent data." };
  }
}

// ============================================
// ORGANISATION ACTIONS
// ============================================

export async function createOrganisation(prevState: unknown, formData: FormData) {
  const admin = await verifySuperAdminSession();
  if (!admin) return { error: "Unauthorized" };

  const name = formData.get("name")?.toString().trim();
  const shortName = formData.get("shortName")?.toString().trim();
  const slug = formData.get("slug")?.toString().trim().toLowerCase();
  const contactEmail = formData.get("contactEmail")?.toString().trim();
  const primaryColor = formData.get("primaryColor")?.toString().trim();
  const accentColor = formData.get("accentColor")?.toString().trim();
  const logoUrl = formData.get("logoUrl")?.toString().trim();
  
  const adminName = formData.get("adminName")?.toString().trim();
  const adminEmail = formData.get("adminEmail")?.toString().trim().toLowerCase();
  const adminPassword = formData.get("adminPassword")?.toString();

  if (!name || !shortName || !slug) return { error: "Name, short name, and slug are required" };
  if (!adminName || !adminEmail) return { error: "Admin Name and Email are required" };
  if (!/^[a-z0-9-]+$/.test(slug)) return { error: "Invalid slug format" };

  const existing = await prisma.organisation.findUnique({ where: { slug } });
  if (existing) return { error: "This slug is already taken" };

  try {
    const { rawToken, newOrg, isNewAdmin, hasPassword } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newOrg = await tx.organisation.create({
        data: {
          name,
          shortName,
          slug,
          contactEmail: contactEmail || null,
          primaryColor: primaryColor || null,
          accentColor: accentColor || null,
          logoUrl: logoUrl || null,
          createdBy: admin.adminId,
        }
      });

      let adminRecord = await tx.adminUser.findUnique({ where: { email: adminEmail } });
      let isNewAdmin = false;

      if (!adminRecord) {
        isNewAdmin = true;
        adminRecord = await tx.adminUser.create({
          data: {
            email: adminEmail,
            name: adminName,
            password: null,
            role: "reviewer",
          }
        });
      }

      await tx.orgMember.create({
        data: {
          organisationId: newOrg.id,
          adminUserId: adminRecord.id,
          role: "org_admin",
        }
      });
      
      const token = (!adminRecord.password) ? await createPasswordSetupToken(adminRecord.id) : null;

      return { 
        rawToken: token, 
        newOrg, 
        isNewAdmin,
        hasPassword: !!adminRecord.password 
      };
    });

    if (rawToken) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const resetLink = `${baseUrl}/auth/set-password?token=${rawToken}`;
      await sendEmail({
        to: adminEmail,
        subject: `Welcome to ${name}!`,
        text: `You have been invited as the administrator for ${name}. Please set your password here: ${resetLink}`,
        html: `<p>You have been invited as the administrator for <strong>${name}</strong>.</p><p><a href="${resetLink}">Click here to set your password</a></p>`
      });
    } else if (!isNewAdmin && hasPassword) {
      await sendEmail({
        to: adminEmail,
        subject: `Added to ${name}`,
        text: `You have been added as an administrator for ${name}. You can log in using your existing account.`,
        html: `<p>You have been added as an administrator for <strong>${name}</strong>.</p><p>You can log in using your existing account.</p>`
      });
    }

    await logAudit(admin.adminId, "org.created", { name, slug }, null, newOrg.id);
  } catch (error) {
    console.error(error);
    return { error: "Failed to create organisation and admin account" };
  }

  redirect(`/superadmin/orgs/${slug}`);
}

export async function suspendOrganisation(orgId: string) {
  const admin = await verifySuperAdminSession();
  if (!admin) return { success: false, error: "Unauthorized" };

  await prisma.organisation.update({
    where: { id: orgId },
    data: { status: "suspended" }
  });

  await logAudit(admin.adminId, "org.suspended", {}, null, orgId);
  return { success: true };
}

export async function reactivateOrganisation(orgId: string) {
  const admin = await verifySuperAdminSession();
  if (!admin) return { success: false, error: "Unauthorized" };

  await prisma.organisation.update({
    where: { id: orgId },
    data: { status: "active" }
  });

  await logAudit(admin.adminId, "org.reactivated", {}, null, orgId);
  return { success: true };
}

export async function deleteOrganisation(orgId: string) {
  const admin = await verifySuperAdminSession();
  if (!admin) return { success: false, error: "Unauthorized" };

  try {
    await prisma.organisation.delete({
      where: { id: orgId }
    });
    await logAudit(admin.adminId, "org.deleted", {}, null, orgId);
    return { success: true };
  } catch (error: any) {
    console.error("Delete org error:", error);
    return { success: false, error: "Failed to delete organisation. It may have dependent elections." };
  }
}

export async function resendOrgAdminInvite(adminUserId: string, orgSlug: string) {
  const admin = await verifySuperAdminSession();
  if (!admin) return { success: false, error: "Unauthorized" };

  try {
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: adminUserId },
    });
    if (!adminUser) return { success: false, error: "Admin user not found" };

    const rawToken = await createPasswordSetupToken(adminUser.id);
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/auth/set-password?token=${rawToken}`;
    await sendEmail({
      to: adminUser.email,
      subject: `Your Admin Invitation`,
      text: `You have been invited as an org admin. Please set your password here: ${resetLink}`,
      html: `<p>You have been invited as an org admin.</p><p><a href="${resetLink}">Click here to set your password</a></p>`
    });
    
    await logAudit(admin.adminId, "org.invite_resent", { targetEmail: adminUser.email }, null);
    return { success: true };
  } catch (err) {
    console.error("Resend invite error:", err);
    return { success: false, error: "Failed to resend invite" };
  }
}


// ============================================
// ELECTION ACTIONS (now org-scoped)
// ============================================

export async function createElection(prevState: unknown, formData: FormData) {
  const admin = await verifySuperAdminSession();
  if (!admin) return { error: "Unauthorized" };

  const name = formData.get("name")?.toString().trim();
  const slug = formData.get("slug")?.toString().trim().toLowerCase();
  const description = formData.get("description")?.toString().trim();
  const organisationId = formData.get("organisationId")?.toString();

  if (!name || !slug) return { error: "Name and slug are required" };
  if (!organisationId) return { error: "Organisation is required" };
  if (!/^[a-z0-9-]+$/.test(slug)) return { error: "Invalid slug format" };

  const existing = await prisma.election.findUnique({ where: { slug } });
  if (existing) return { error: "This slug is already taken" };

  const org = await prisma.organisation.findUnique({ where: { id: organisationId } });
  if (!org) return { error: "Organisation not found" };

  try {
    const election = await prisma.election.create({
      data: {
        name,
        slug,
        description: description || null,
        organisationId,
        createdBy: admin.adminId,
        config: {
          create: {
            opensAt: new Date(),
            closesAt: new Date(),
          }
        }
      }
    });

    await logAudit(admin.adminId, "election.created", { name, slug }, election.id, organisationId);

  } catch (error) {
    console.error(error);
    return { error: "Failed to create election" };
  }

  redirect(`/superadmin/orgs/${org.slug}`);
}

export async function cloneElection(sourceId: string, newName: string) {
  const admin = await verifySuperAdminSession();
  if (!admin) return { success: false, error: "Unauthorized" };

  const source = await prisma.election.findUnique({
    where: { id: sourceId },
    include: { positions: { include: { candidates: true } } }
  });

  if (!source) return { success: false, error: "Source election not found" };

  let baseSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.election.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  try {
    const newElection = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const el = await tx.election.create({
        data: {
          name: newName,
          slug,
          description: source.description,
          organisationId: source.organisationId,
          createdBy: admin.adminId,
          config: {
            create: {
              opensAt: new Date(),
              closesAt: new Date(),
            }
          }
        }
      });

      for (const pos of source.positions) {
        const newPos = await tx.position.create({
          data: { electionId: el.id, title: pos.title, order: pos.order }
        });

        for (const cand of pos.candidates) {
          await tx.candidate.create({
            data: { positionId: newPos.id, name: cand.name, manifesto: cand.manifesto, photoUrl: cand.photoUrl }
          });
        }
      }

      return el;
    });

    await logAudit(admin.adminId, "election.cloned", { source: source.name, new: newName }, newElection.id, source.organisationId);
    return { success: true, slug: newElection.slug };

  } catch (e) {
    console.error(e);
    return { success: false, error: "Database error during clone" };
  }
}

export async function forceCloseElection(electionId: string) {
  const admin = await verifySuperAdminSession();
  if (!admin) return { success: false, error: "Unauthorized" };

  await prisma.election.update({
    where: { id: electionId },
    data: { status: "closed" }
  });

  await logAudit(admin.adminId, "election.force_closed", {}, electionId);
  return { success: true };
}

export async function uncertifyElection(electionId: string) {
  const admin = await verifySuperAdminSession();
  if (!admin) return { success: false, error: "Unauthorized" };

  await prisma.election.update({
    where: { id: electionId },
    data: { status: "closed" }
  });

  await logAudit(admin.adminId, "election.uncertified", {}, electionId);
  return { success: true };
}

export async function revertElectionToSetup(electionId: string) {
  const admin = await verifySuperAdminSession();
  if (!admin) return { success: false, error: "Unauthorized" };

  await prisma.election.update({
    where: { id: electionId },
    data: { status: "setup" }
  });

  await prisma.electionConfig.updateMany({
    where: { electionId },
    data: { resultsPublished: false }
  });

  await logAudit(admin.adminId, "election.reverted_to_setup", {}, electionId);
  return { success: true };
}

// ============================================
// ELECTION ADMIN TEAM MANAGEMENT
// ============================================

export async function inviteAdmin(electionId: string, email: string, role: string, name?: string) {
  const admin = await verifySuperAdminSession();
  if (!admin) return { success: false, error: "Unauthorized" };

  email = email.toLowerCase().trim();

  const existingUser = await prisma.adminUser.findUnique({ where: { email } });

  if (existingUser) {
    try {
      await prisma.electionAdmin.create({
        data: { electionId, adminUserId: existingUser.id, role }
      });
      await logAudit(admin.adminId, "admin.added", { email, role, type: "direct" }, electionId);
      return { success: true, message: `Added ${existingUser.name} directly.` };
    } catch (e: unknown) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as {code: string}).code === 'P2002') return { success: false, error: "User is already an admin for this election" };
      return { success: false, error: "Failed to add admin" };
    }
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  await prisma.adminInvite.create({
    data: { email, name, electionId, role, token, expiresAt }
  });

  await logAudit(admin.adminId, "admin.invited", { email, role }, electionId);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const acceptLink = `${baseUrl}/invite/${token}`;
  await sendEmail({
    to: email,
    subject: `Invitation to manage an election`,
    text: `You have been invited to manage an election. Accept your invite here: ${acceptLink}`,
    html: `<p>You have been invited to manage an election.</p><p><a href="${acceptLink}">Click here to accept the invitation</a></p>`
  });

  return { success: true, message: `Invite sent to ${email}.` };
}

export async function removeAdmin(electionAdminId: string, electionId: string) {
  const admin = await verifySuperAdminSession();
  if (!admin) return { success: false, error: "Unauthorized" };

  const count = await prisma.electionAdmin.count({ where: { electionId, role: "admin" } });
  const target = await prisma.electionAdmin.findUnique({ where: { id: electionAdminId } });
  
  if (target?.role === "admin" && count <= 1) {
    return { success: false, error: "Cannot remove the last admin." };
  }

  await prisma.electionAdmin.delete({ where: { id: electionAdminId } });
  await logAudit(admin.adminId, "admin.removed", { targetId: target?.adminUserId }, electionId);

  return { success: true };
}

export async function changeAdminRole(electionAdminId: string, electionId: string, newRole: string) {
  const admin = await verifySuperAdminSession();
  if (!admin) return { success: false, error: "Unauthorized" };

  if (newRole === "reviewer") {
    const count = await prisma.electionAdmin.count({ where: { electionId, role: "admin" } });
    if (count <= 1) {
      return { success: false, error: "Cannot demote the last admin." };
    }
  }

  await prisma.electionAdmin.update({
    where: { id: electionAdminId },
    data: { role: newRole }
  });
  await logAudit(admin.adminId, "admin.role_changed", { targetAdminId: electionAdminId, newRole }, electionId);

  return { success: true };
}

// Password Policy: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;

export async function acceptInvite(prevState: unknown, formData: FormData) {
  const token = formData.get("token")?.toString();
  const name = formData.get("name")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!token || !name || !password) return { error: "All fields are required." };

  if (!PASSWORD_REGEX.test(password)) {
    return { error: "Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character." };
  }

  const invite = await prisma.adminInvite.findUnique({ where: { token } });
  
  if (!invite) return { error: "Invalid invite token." };
  if (invite.accepted) return { error: "Invite already accepted." };
  if (new Date() > invite.expiresAt) return { error: "Invite expired." };

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.adminUser.create({
        data: {
          email: invite.email,
          name,
          password: hashedPassword,
          role: "reviewer",
        }
      });

      // Link to election or org depending on invite type
      if (invite.electionId) {
        await tx.electionAdmin.create({
          data: { electionId: invite.electionId, adminUserId: user.id, role: invite.role }
        });
      }

      if (invite.organisationId) {
        await tx.orgMember.create({
          data: { organisationId: invite.organisationId, adminUserId: user.id, role: invite.role }
        });
      }

      await tx.adminInvite.update({
        where: { id: invite.id },
        data: { accepted: true }
      });
    });

    return { success: true };
  } catch (e: unknown) {
    if (typeof e === 'object' && e !== null && 'code' in e && (e as {code: string}).code === 'P2002') return { error: "An account with this email already exists." };
    return { error: "Failed to create account." };
  }
}
