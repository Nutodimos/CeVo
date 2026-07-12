import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin-auth";
import { adminLogout } from "@/app/actions/admin";
import { notFound, redirect } from "next/navigation";
import ElectionNav from "./ElectionNav";

export default async function ElectionAdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgSlug: string; slug: string }>;
}) {
  const admin = await verifyAdminSession();
  if (!admin) redirect("/admin/login");

  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const election = await prisma.election.findUnique({
    where: { slug },
  });

  if (!election) notFound();

  // Check role for this election
  let electionRole: string | null = null;
  if (admin.role === "super_admin") {
    electionRole = "admin";
  } else {
    // Check if they are an OrgAdmin for this organisation
    const orgMember = await prisma.orgMember.findFirst({
      where: {
        organisation: { slug: resolvedParams.orgSlug },
        adminUserId: admin.adminId,
        role: "org_admin"
      }
    });

    if (orgMember) {
      electionRole = "admin";
    } else {
      // Fallback to explicit election reviewer
      const adminRel = await prisma.electionAdmin.findUnique({
        where: { electionId_adminUserId: { electionId: election.id, adminUserId: admin.adminId } }
      });
      if (adminRel) {
        electionRole = adminRel.role;
      }
    }
  }

  if (!electionRole) {
    // Not authorized for this election at all
    redirect(`/org/${resolvedParams.orgSlug}/admin`);
  }

  // Server action wrapper for logout so the client component can call it
  const handleLogout = async () => {
    "use server";
    await adminLogout();
    redirect("/admin/login");
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-surface-50 text-surface-900 overflow-hidden">
      <ElectionNav 
        orgSlug={resolvedParams.orgSlug}
        slug={slug} 
        role={electionRole} 
        electionName={election.name} 
        electionStatus={election.status} 
        onLogoutAction={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-surface-50">
        <div className="max-w-5xl mx-auto p-4 md:p-0 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
