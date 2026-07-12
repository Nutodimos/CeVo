import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin-auth";
import { notFound, redirect } from "next/navigation";
import OrgAdminSidebar from "../OrgAdminSidebar";

export default async function OrgSettingsLayout({
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

  const user = await prisma.adminUser.findUnique({ where: { id: admin.adminId } });
  if (!user) redirect("/admin/login");

  // Verify access: super_admin or OrgMember
  if (admin.role !== "super_admin") {
    const membership = await prisma.orgMember.findUnique({
      where: { organisationId_adminUserId: { organisationId: org.id, adminUserId: admin.adminId } }
    });
    if (!membership) redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col md:flex-row">
      <OrgAdminSidebar
        adminEmail={admin.email}
        adminName={user.name}
        adminAvatarUrl={user.avatarUrl}
        orgSlug={org.slug}
        orgShortName={org.shortName}
        orgLogoUrl={org.logoUrl}
        orgPrimaryColor={org.primaryColor}
      />

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
