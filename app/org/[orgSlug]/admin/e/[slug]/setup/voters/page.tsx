import { prisma } from "@/lib/prisma";
import { getElectionBySlug } from "@/lib/election-context";
import { getElectionStatus } from "@/lib/election";
import VoterRollManager from "./VoterRollManager";

export default async function VotersSetupPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const electionContext = await getElectionBySlug(slug);
  const electionId = electionContext.id;
  const election = await getElectionStatus(electionId);

  const voters = await prisma.voterRoll.findMany({
    where: { electionId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="px-4 py-6 md:p-8 max-w-5xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900 mb-2">Voter Roll</h1>
        <p className="text-surface-600">
          Upload and manage the list of eligible voters for this election.
        </p>
      </div>

      <VoterRollManager 
        electionId={electionId} 
        initialVoters={voters} 
        isLocked={election.status !== "setup"} 
      />
    </div>
  );
}
