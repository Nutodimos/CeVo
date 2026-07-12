import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin-auth";
import { notFound, redirect } from "next/navigation";

export default async function OrgAdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const admin = await verifyAdminSession();
  if (!admin) redirect("/admin/login");

  const resolvedParams = await params;
  const orgSlug = resolvedParams.orgSlug;

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug } });
  if (!org) notFound();

  // Verify access: super_admin or OrgMember
  if (admin.role !== "super_admin") {
    const membership = await prisma.orgMember.findUnique({
      where: { organisationId_adminUserId: { organisationId: org.id, adminUserId: admin.adminId } }
    });
    if (!membership) redirect("/admin/login");
  }

  return children;
}
