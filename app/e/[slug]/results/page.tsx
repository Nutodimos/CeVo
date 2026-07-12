import { prisma } from "@/lib/prisma";
import { getElectionStatus } from "@/lib/election";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

import { getElectionBySlug } from "@/lib/election-context";

export const dynamic = "force-dynamic";

export default async function ResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const electionContext = await getElectionBySlug(slug);
  const election = await getElectionStatus(electionContext.id);

  // Strict gating
  if (!election.isClosed || !election.resultsPublished) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div className="glass-card" style={{ padding: "3rem", maxWidth: "400px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 1.5rem",
              borderRadius: "50%",
              background: "var(--color-surface-200)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-surface-500)",
            }}
          >
            <Lock size={32} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Results Not Available
          </h2>
          <p style={{ color: "var(--color-surface-500)", marginBottom: "2rem" }}>
            The election results will be published here after the voting window has closed and the final tallies are verified.
          </p>
          <Link href={`/e/${slug}`} className="btn-secondary" style={{ textDecoration: "none", display: "inline-block" }}>
            Return to Portal
          </Link>
        </div>
      </main>
    );
  }

  // Fetch all positions and candidates
  const positions = await prisma.position.findMany({
    where: { electionId: electionContext.id },
    include: { candidates: true },
    orderBy: { order: "asc" },
  });

  // Fetch all anonymous votes
  const votes = await prisma.vote.findMany({
    where: { electionId: electionContext.id }
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "3rem 1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "800px" }}>
        <Link 
          href={`/e/${slug}`} 
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "0.5rem", 
            color: "var(--color-surface-500)", 
            marginBottom: "2rem",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontWeight: 500
          }}
        >
          <ArrowLeft size={16} />
          Back to Portal
        </Link>

        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Official Election Results
        </h1>
        <p style={{ color: "var(--color-surface-500)", marginBottom: "3rem" }}>
          Final, verified tallies with demographic breakdowns.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
          {positions.map((pos) => {
            // Calculate totals and demographic breakdowns for this position
            const candidateStats = pos.candidates.map((cand) => {
              const candVotes = votes.filter((v) => v.candidateId === cand.id);
              
              // Count by level
              const levels: Record<string, number> = {};
              candVotes.forEach((v) => {
                const lvl = v.voterLevel || "Unknown";
                levels[lvl] = (levels[lvl] || 0) + 1;
              });

              return {
                ...cand,
                totalVotes: candVotes.length,
                levels,
              };
            });

            // Sort candidates by highest votes
            candidateStats.sort((a, b) => b.totalVotes - a.totalVotes);
            
            // Find max votes to highlight the winner
            const maxVotes = candidateStats[0]?.totalVotes || 0;

            return (
              <div key={pos.id} className="glass-card" style={{ padding: "2rem" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", borderBottom: "1px solid var(--color-surface-200)", paddingBottom: "1rem" }}>
                  {pos.title}
                </h2>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {candidateStats.map((cand) => {
                    const isWinner = cand.totalVotes > 0 && cand.totalVotes === maxVotes;
                    
                    return (
                      <div 
                        key={cand.id} 
                        style={{ 
                          padding: "1.5rem", 
                          borderRadius: "0.75rem", 
                          background: isWinner ? "linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(79, 70, 229, 0.1))" : "var(--color-surface-100)",
                          border: isWinner ? "1px solid var(--color-primary-200)" : "1px solid transparent",
                          position: "relative"
                        }}
                      >
                        {isWinner && (
                          <div style={{ position: "absolute", top: "-10px", right: "20px", background: "var(--color-primary-500)", color: "white", padding: "4px 12px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700 }}>
                            WINNER
                          </div>
                        )}
                        
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                          <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                            {cand.name}
                          </div>
                          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: isWinner ? "var(--color-primary-600)" : "inherit" }}>
                            {cand.totalVotes} <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-surface-500)" }}>votes</span>
                          </div>
                        </div>

                        {/* Demographic Breakdown */}
                        {cand.totalVotes > 0 && (
                          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
                            {Object.entries(cand.levels).sort((a, b) => a[0].localeCompare(b[0])).map(([level, count]) => (
                              <div key={level} style={{ fontSize: "0.75rem", background: "var(--color-surface-200)", padding: "4px 10px", borderRadius: "6px", color: "var(--color-surface-600)" }}>
                                <span style={{ fontWeight: 600 }}>{level}</span>: {count}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
