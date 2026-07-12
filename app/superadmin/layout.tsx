import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { verifySuperAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import SuperAdminSidebar from "./SuperAdminSidebar";

export default async function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await verifySuperAdminSession();
  if (!admin) {
    redirect("/admin/login");
  }

  // Fetch health metrics
  const [orgCount, activeElectionsCount, totalPendingReviews] = await Promise.all([
    prisma.organisation.count(),
    prisma.election.count({ where: { status: "active" } }),
    prisma.pendingVote.count({ where: { status: { in: ["pending_review", "flagged_invalid"] } } }),
  ]);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <SuperAdminSidebar
        adminEmail={admin.email}
        orgCount={orgCount}
        activeElectionsCount={activeElectionsCount}
        totalPendingReviews={totalPendingReviews}
      />

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
