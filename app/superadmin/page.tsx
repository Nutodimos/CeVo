import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Building2, Play, Archive, CheckCircle2, Ban } from "lucide-react";

export default async function SuperAdminDashboard() {
  const orgs = await prisma.organisation.findMany({
    include: {
      _count: { select: { elections: true, members: true } },
      elections: {
        select: { status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const orgData = orgs.map((org) => {
    const activeCount = org.elections.filter((e) => e.status === "active").length;
    const lastElection = org.elections[0];
    return {
      ...org,
      activeCount,
      lastElectionDate: lastElection
        ? new Date(lastElection.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
        : "—",
    };
  });

  const totalOrgs = orgs.length;
  const totalActiveElections = orgData.reduce((sum, o) => sum + o.activeCount, 0);
  const totalElections = orgData.reduce((sum, o) => sum + o._count.elections, 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-foreground/60 mt-1">Manage organisations and provision CeVo election instances.</p>
        </div>
        <Link href="/superadmin/orgs/new" className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Organisation
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card border border-white/10 rounded-xl p-5">
          <p className="text-sm text-foreground/60 font-medium mb-1">Organisations</p>
          <p className="text-3xl font-bold font-mono">{totalOrgs}</p>
        </div>
        <div className="bg-card border border-white/10 rounded-xl p-5">
          <p className="text-sm text-foreground/60 font-medium mb-1">Total Elections</p>
          <p className="text-3xl font-bold font-mono">{totalElections}</p>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-5">
          <p className="text-sm text-emerald-500/80 font-medium mb-1">Active Now</p>
          <p className="text-3xl font-bold font-mono text-emerald-500">{totalActiveElections}</p>
        </div>
      </div>

      <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold text-foreground/80">Organisation</th>
                <th className="px-6 py-4 font-semibold text-foreground/80">Elections</th>
                <th className="px-6 py-4 font-semibold text-foreground/80">Active</th>
                <th className="px-6 py-4 font-semibold text-foreground/80">Last Election</th>
                <th className="px-6 py-4 font-semibold text-foreground/80">Status</th>
                <th className="px-6 py-4 font-semibold text-foreground/80 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {orgData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-foreground/50">
                    No organisations yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                orgData.map((org) => (
                  <tr key={org.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {org.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={org.logoUrl} alt={org.shortName} className="w-8 h-8 object-contain rounded" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-foreground/40" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{org.shortName}</div>
                          <div className="text-xs text-foreground/50">{org.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono">{org._count.elections}</td>
                    <td className="px-6 py-4">
                      {org.activeCount > 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Play className="w-3 h-3 mr-1" />{org.activeCount}
                        </span>
                      ) : (
                        <span className="text-foreground/50 text-xs">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-foreground/60 text-xs">{org.lastElectionDate}</td>
                    <td className="px-6 py-4">
                      {org.status === "active" ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          <Ban className="w-3 h-3 mr-1" /> Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/superadmin/orgs/${org.slug}`}
                        className="inline-flex items-center justify-center px-3 py-1.5 border border-primary-500/30 bg-primary-500/10 text-primary-400 rounded-md text-xs font-medium hover:bg-primary-500/20 transition-colors"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
