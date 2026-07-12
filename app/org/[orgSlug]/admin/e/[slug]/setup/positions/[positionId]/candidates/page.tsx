import { prisma } from "@/lib/prisma";
import { getElectionBySlug } from "@/lib/election-context";
import { getElectionStatus } from "@/lib/election";
import CandidatesManager from "./CandidatesManager";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CandidatesSetupPage({ 
  params 
}: { 
  params: Promise<{ orgSlug: string, slug: string, positionId: string }> 
}) {
  const resolvedParams = await params;
  const { orgSlug, slug, positionId } = resolvedParams;
  const electionContext = await getElectionBySlug(slug);
  const electionId = electionContext.id;
  const election = await getElectionStatus(electionId);

  const position = await prisma.position.findUnique({
    where: { id: positionId, electionId }
  });

  if (!position) notFound();

  const candidates = await prisma.candidate.findMany({
    where: { positionId },
    orderBy: { order: "asc" },
  });

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <Link 
          href={`/org/${orgSlug}/admin/e/${slug}/setup/positions`} 
          className="text-primary-500 hover:text-primary-600 font-medium mb-4 flex items-center gap-2 text-sm w-fit transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Positions
        </Link>
        <h1 className="text-2xl font-bold text-surface-900 mb-2">Candidates: {position.title}</h1>
        <p className="text-surface-600">
          Manage the candidates running for this position. Drag to reorder them as they should appear on the ballot.
        </p>
      </div>

      <CandidatesManager 
        electionId={electionId} 
        positionId={positionId}
        initialCandidates={candidates} 
        isLocked={election.status !== "setup"} 
      />
    </div>
  );
}
