import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Users, Shield, User } from "lucide-react";

export default async function OrgMembersPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const resolvedParams = await params;
  const orgSlug = resolvedParams.orgSlug;

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    include: {
      members: {
        include: { admin: true },
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!org) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Organisation Members</h1>
        <p className="text-surface-600 mt-1">Manage who has administrative access to this organisation.</p>
      </div>

      <div className="bg-white border border-surface-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-surface-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-500" /> Active Members
          </h2>
          {/* Invite functionality could be added here later */}
        </div>
        
        <div className="divide-y divide-surface-100">
          {org.members.map((member) => (
            <div key={member.id} className="p-4 flex items-center justify-between hover:bg-surface-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                  {member.admin.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-surface-900">{member.admin.name}</div>
                  <div className="text-sm text-surface-500">{member.admin.email}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-100 text-surface-600 text-xs font-medium">
                  {member.role === "org_admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {member.role === "org_admin" ? "Org Admin" : "Viewer"}
                </div>
                {/* Remove/edit actions can be added here */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
