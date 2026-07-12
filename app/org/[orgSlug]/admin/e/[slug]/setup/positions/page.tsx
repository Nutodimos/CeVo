import { prisma } from "@/lib/prisma";
import { getElectionBySlug } from "@/lib/election-context";
import { getElectionStatus } from "@/lib/election";
import PositionsManager from "./PositionsManager";

export default async function PositionsSetupPage({ params }: { params: Promise<{ orgSlug: string; slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const electionContext = await getElectionBySlug(slug);
  const electionId = electionContext.id;
  const election = await getElectionStatus(electionId);

  const positions = await prisma.position.findMany({
    where: { electionId },
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { candidates: true }
      }
    }
  });

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900 mb-2">Positions</h1>
        <p className="text-surface-600">
          Manage the positions voters will vote for. Drag to reorder them as they should appear on the ballot.
        </p>
      </div>

      <PositionsManager 
        orgSlug={resolvedParams.orgSlug}
        electionId={electionId} 
        electionSlug={slug}
        initialPositions={positions} 
        isLocked={election.status !== "setup"} 
      />
    </div>
  );
}
