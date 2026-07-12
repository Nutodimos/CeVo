import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, CheckCircle, Clock, Archive } from "lucide-react";
import AdminTeamTable from "./AdminTeamTable";
import ElectionTransitions from "./ElectionTransitions";

export default async function SuperAdminElectionDetail({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const election = await prisma.election.findUnique({
    where: { slug },
    include: {
      config: true,
      admins: {
        include: { admin: true },
        orderBy: { createdAt: "asc" }
      },
      _count: {
        select: {
          voterRoll: true,
          pendingVotes: { where: { status: { in: ["pending_review", "flagged_invalid"] } } }
        }
      }
    }
  });

  if (!election) notFound();

  const registeredCount = election._count.voterRoll;
  const pendingReviewsCount = election._count.pendingVotes;
  const votedCount = await prisma.voterRoll.count({ where: { electionId: election.id, hasVoted: true } });
  const turnoutPercent = registeredCount > 0 ? Math.round((votedCount / registeredCount) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <Link href="/superadmin" className="inline-flex items-center text-sm text-foreground/60 hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Overview
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{election.name}</h1>
            <p className="text-foreground/60 mt-1 font-mono text-sm">/e/{election.slug}</p>
          </div>
          
          <ElectionTransitions electionId={election.id} electionName={election.name} status={election.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1 text-foreground/60">
            <Users className="w-4 h-4" />
            <p className="text-sm font-medium">Registered Voters</p>
          </div>
          <p className="text-3xl font-bold font-mono">{registeredCount}</p>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1 text-emerald-500/80">
            <CheckCircle className="w-4 h-4" />
            <p className="text-sm font-medium">Votes Cast</p>
          </div>
          <p className="text-3xl font-bold font-mono text-emerald-500">{votedCount}</p>
          <p className="text-xs text-emerald-500/60 mt-1">{turnoutPercent}% Turnout</p>
        </div>
        <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1 text-yellow-500/80">
            <Clock className="w-4 h-4" />
            <p className="text-sm font-medium">Pending Review</p>
          </div>
          <p className="text-3xl font-bold font-mono text-yellow-500">{pendingReviewsCount}</p>
        </div>
        <div className="bg-card border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1 text-foreground/60">
            <Archive className="w-4 h-4" />
            <p className="text-sm font-medium">Status</p>
          </div>
          <p className="text-lg font-semibold uppercase tracking-wider text-foreground/80 mt-2">{election.status}</p>
        </div>
      </div>

      <div className="bg-card border border-white/10 rounded-xl p-6">
        <AdminTeamTable electionId={election.id} admins={election.admins} />
      </div>
    </div>
  );
}
