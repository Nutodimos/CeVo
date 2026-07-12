import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, CheckCircle, Archive, Plus, Play, Settings, Ban } from "lucide-react";
import OrgActions from "./OrgActions";

export default async function OrgDetailPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const resolvedParams = await params;
  const orgSlug = resolvedParams.orgSlug;

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    include: {
      members: {
        include: { admin: true },
        orderBy: { createdAt: "asc" }
      },
      elections: {
        include: {
          _count: { select: { voterRoll: true } },
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!org) notFound();

  const electionsWithVoted = await Promise.all(org.elections.map(async (e) => {
    const votedCount = await prisma.voterRoll.count({ where: { electionId: e.id, hasVoted: true } });
    return { ...e, votedCount };
  }));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "setup":
        return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20"><Settings className="w-3 h-3 mr-1" /> Setup</span>;
      case "active":
        return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><Play className="w-3 h-3 mr-1" /> Active</span>;
      case "closed":
        return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><Archive className="w-3 h-3 mr-1" /> Closed</span>;
      case "certified":
        return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Certified</span>;
      default:
        return <span className="text-xs text-foreground/50">{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <Link href="/superadmin" className="inline-flex items-center text-sm text-foreground/60 hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Organisations
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {org.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logoUrl} alt={org.shortName} className="w-14 h-14 object-contain rounded-xl border border-white/10" />
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{org.shortName}</h1>
              <p className="text-foreground/60 mt-0.5">{org.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <OrgActions orgId={org.id} orgSlug={org.slug} status={org.status} orgName={org.name} />
            <Link href={`/superadmin/orgs/${orgSlug}/elections/new`} className="btn-primary inline-flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Create Election
            </Link>
          </div>
        </div>
      </div>

      {/* Branding Preview */}
      <div className="bg-card border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Branding</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg border border-white/10" style={{ backgroundColor: org.primaryColor || "#666" }} />
            <div>
              <div className="text-xs text-foreground/50">Primary</div>
              <div className="text-sm font-mono">{org.primaryColor || "Not set"}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg border border-white/10" style={{ backgroundColor: org.accentColor || "#666" }} />
            <div>
              <div className="text-xs text-foreground/50">Accent</div>
              <div className="text-sm font-mono">{org.accentColor || "Not set"}</div>
            </div>
          </div>
          {org.contactEmail && (
            <div>
              <div className="text-xs text-foreground/50">Contact</div>
              <div className="text-sm">{org.contactEmail}</div>
            </div>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="bg-card border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" /> Org Members ({org.members.length})
        </h3>
        <div className="divide-y divide-white/10">
          {org.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium">{m.admin.name}</div>
                <div className="text-sm text-foreground/50">{m.admin.email}</div>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded bg-white/5 border border-white/10 capitalize">
                {m.role.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Elections */}
      <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold">Elections ({electionsWithVoted.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 font-semibold text-foreground/80">Election</th>
                <th className="px-6 py-3 font-semibold text-foreground/80">Status</th>
                <th className="px-6 py-3 font-semibold text-foreground/80">Turnout</th>
                <th className="px-6 py-3 font-semibold text-foreground/80">Created</th>
                <th className="px-6 py-3 font-semibold text-foreground/80 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {electionsWithVoted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-foreground/50">
                    No elections yet. Create one above.
                  </td>
                </tr>
              ) : (
                electionsWithVoted.map((election) => {
                  const registered = election._count.voterRoll;
                  const voted = election.votedCount;
                  const percent = registered > 0 ? Math.round((voted / registered) * 100) : 0;
                  return (
                    <tr key={election.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium">{election.name}</div>
                        <div className="text-xs text-foreground/50 font-mono">/e/{election.slug}</div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(election.status)}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono">{voted}/{registered} ({percent}%)</span>
                      </td>
                      <td className="px-6 py-4 text-foreground/60 text-xs">
                        {new Date(election.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/org/${orgSlug}/admin/e/${election.slug}`}
                          className="inline-flex items-center justify-center px-3 py-1.5 border border-primary-500/30 bg-primary-500/10 text-primary-400 rounded-md text-xs font-medium hover:bg-primary-500/20 transition-colors"
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
