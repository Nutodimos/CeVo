import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus, Play, Settings, Archive, CheckCircle } from "lucide-react";

export default async function OrgAdminPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const resolvedParams = await params;
  const orgSlug = resolvedParams.orgSlug;

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    include: {
      elections: {
        include: { _count: { select: { voterRoll: true } } },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!org) notFound();

  const electionsWithVoted = await Promise.all(org.elections.map(async (e) => {
    const votedCount = await prisma.voterRoll.count({ where: { electionId: e.id, hasVoted: true } });
    return { ...e, votedCount };
  }));

  const activeCount = org.elections.filter(e => e.status === "active").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "setup":
        return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-surface-100 text-surface-500 border border-surface-200"><Settings className="w-3 h-3 mr-1" /> Setup</span>;
      case "active":
        return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200"><Play className="w-3 h-3 mr-1" /> Active</span>;
      case "closed":
        return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200"><Archive className="w-3 h-3 mr-1" /> Closed</span>;
      case "certified":
        return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200"><CheckCircle className="w-3 h-3 mr-1" /> Certified</span>;
      default:
        return <span className="text-xs text-surface-500">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-surface-900">{org.shortName} Elections</h1>
          <p className="text-surface-600 mt-1">{org.name}</p>
        </div>
        <Link href={`/org/${orgSlug}/admin/elections/new`} className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Election
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm">
          <p className="text-sm text-surface-500 font-medium mb-1">Total Elections</p>
          <p className="text-3xl font-bold font-mono text-surface-900">{org.elections.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm">
          <p className="text-sm text-emerald-600 font-medium mb-1">Active Now</p>
          <p className="text-3xl font-bold font-mono text-emerald-600">{activeCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-surface-700">Election</th>
                <th className="px-6 py-4 font-semibold text-surface-700">Status</th>
                <th className="px-6 py-4 font-semibold text-surface-700">Turnout</th>
                <th className="px-6 py-4 font-semibold text-surface-700">Created</th>
                <th className="px-6 py-4 font-semibold text-surface-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {electionsWithVoted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-surface-500">
                    No elections yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                electionsWithVoted.map((election) => {
                  const registered = election._count.voterRoll;
                  const voted = election.votedCount;
                  const percent = registered > 0 ? Math.round((voted / registered) * 100) : 0;
                  return (
                    <tr key={election.id} className="hover:bg-surface-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-surface-900">{election.name}</div>
                        <div className="text-xs text-surface-500 font-mono">/e/{election.slug}</div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(election.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-surface-200 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="text-xs font-mono text-surface-600">{voted}/{registered} ({percent}%)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-surface-500 text-xs">
                        {new Date(election.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/org/${orgSlug}/admin/e/${election.slug}`}
                          className="inline-flex items-center justify-center px-3 py-1.5 border border-primary-300 bg-primary-50 text-primary-600 rounded-md text-xs font-medium hover:bg-primary-100 transition-colors"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
