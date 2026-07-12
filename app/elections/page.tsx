import { prisma } from "@/lib/prisma";
import Link from "next/link";

import { Trophy, Users, Calendar, MapPin } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CeVo — Election Results Archive",
  description: "Results from past elections run on CeVo.",
};

export const dynamic = "force-dynamic";

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const resolvedParams = await searchParams;
  const orgFilter = resolvedParams.org;

  // 1. Fetch eligible elections
  const whereClause: any = {
    status: { in: ["closed", "certified"] },
    config: { resultsPublished: true },
  };

  if (orgFilter) {
    whereClause.organisation = { slug: orgFilter };
  }

  const elections = await prisma.election.findMany({
    where: whereClause,
    include: {
      organisation: true,
      config: true,
      positions: {
        orderBy: { order: "asc" },
        include: {
          candidates: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc", // Most recent first
    },
  });

  // 2. Fetch required aggregate data for each election
  const archiveData = await Promise.all(
    elections.map(async (election) => {
      // Get turnout
      const [totalVoters, votedCount] = await Promise.all([
        prisma.voterRoll.count({ where: { electionId: election.id } }),
        prisma.voterRoll.count({ where: { electionId: election.id, hasVoted: true } }),
      ]);

      const percent = totalVoters > 0 ? Math.round((votedCount / totalVoters) * 100) : 0;

      // Get vote counts
      const voteCounts = await prisma.vote.groupBy({
        by: ["candidateId"],
        _count: { candidateId: true },
        where: { electionId: election.id },
      });

      const countMap = Object.fromEntries(voteCounts.map((v) => [v.candidateId, v._count.candidateId]));

      // Determine winners per position
      const winners = election.positions.map((pos) => {
        let maxVotes = -1;
        let winnerName = "No votes";

        for (const cand of pos.candidates) {
          const votes = countMap[cand.id] || 0;
          if (votes > maxVotes) {
            maxVotes = votes;
            winnerName = cand.name;
          } else if (votes === maxVotes && maxVotes > 0) {
            winnerName += ` & ${cand.name} (Tie)`;
          }
        }

        return {
          position: pos.title,
          winner: maxVotes > 0 ? winnerName : "No winner",
          votes: maxVotes > 0 ? maxVotes : 0,
        };
      });

      return {
        id: election.id,
        name: election.name,
        slug: election.slug,
        orgName: election.organisation.shortName,
        orgLogo: election.organisation.logoUrl,
        dateHeld: election.config?.closesAt ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(election.config.closesAt)) : "Unknown",
        turnout: percent,
        votedCount,
        winners,
      };
    })
  );

  return (
    <main className="min-h-screen bg-surface-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-surface-900 tracking-tight mb-4">
            Election Archive
          </h1>
          <p className="text-lg text-surface-600 max-w-2xl mx-auto">
            Transparent, immutable results from past elections powered by the CeVo platform.
          </p>
        </div>

        {/* Empty State */}
        {archiveData.length === 0 ? (
          <div className="bg-white rounded-2xl border border-surface-200 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-surface-400" />
            </div>
            <h2 className="text-xl font-bold text-surface-900 mb-2">No archived elections yet</h2>
            <p className="text-surface-500">
              {orgFilter 
                ? `No published results found for "${orgFilter}".` 
                : "When an election is completed and results are published, they will appear here forever."}
            </p>
            {orgFilter && (
              <Link href="/elections" className="inline-block mt-6 text-primary-600 font-medium hover:underline">
                Clear filter
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {archiveData.map((election) => (
              <div 
                key={election.id}
                className="bg-white rounded-2xl border border-surface-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-surface-100">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-surface-900 leading-tight mb-1">
                        {election.name}
                      </h2>
                      {election.orgName && (
                        <div className="flex items-center text-sm font-medium text-primary-600 gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {election.orgName}
                        </div>
                      )}
                    </div>
                    {election.orgLogo && (
                      <img 
                        src={election.orgLogo} 
                        alt={`${election.orgName} logo`} 
                        className="w-12 h-12 object-contain rounded bg-surface-50 shrink-0"
                      />
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-surface-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {election.dateHeld}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {election.turnout}% Turnout
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-surface-50 flex-1 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-3">
                      Key Results
                    </h3>
                    <div className="space-y-2">
                      {election.winners.slice(0, 3).map((w, i) => (
                        <div key={i} className="flex justify-between items-baseline text-sm">
                          <span className="font-medium text-surface-600">{w.position}:</span>
                          <span className="font-bold text-surface-900 text-right ml-2 truncate">
                            {w.winner}
                          </span>
                        </div>
                      ))}
                      {election.winners.length > 3 && (
                        <div className="text-xs text-surface-500 font-medium pt-1">
                          + {election.winners.length - 3} more positions
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-surface-100 bg-white">
                  <Link 
                    href={`/e/${election.slug}`}
                    className="block w-full py-2.5 text-center text-sm font-semibold text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
                  >
                    View Full Results
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
