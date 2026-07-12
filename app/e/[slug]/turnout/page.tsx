import { prisma } from "@/lib/prisma";
import LiveTurnout from "./LiveTurnout";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getElectionBySlug } from "@/lib/election-context";

export const dynamic = "force-dynamic";

export default async function TurnoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const election = await getElectionBySlug(slug);

  const [totalVoters, votedCount] = await Promise.all([
    prisma.voterRoll.count({ where: { electionId: election.id } }),
    prisma.voterRoll.count({ where: { electionId: election.id, hasVoted: true } }),
  ]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "500px" }}>
        <Link 
          href={`/e/${slug}`} 
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "0.5rem", 
            color: "var(--color-surface-500)", 
            marginBottom: "1.5rem",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontWeight: 500
          }}
        >
          <ArrowLeft size={16} />
          Back to Portal
        </Link>
        
        <LiveTurnout initialTotal={totalVoters} initialVoted={votedCount} />
      </div>
    </main>
  );
}
