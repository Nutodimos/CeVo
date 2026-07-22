import { prisma } from "@/lib/prisma";
import { getElectionBySlug } from "@/lib/election-context";
import { getElectionStatus } from "@/lib/election";
import ConfigManager from "./ConfigManager";

export default async function ConfigSetupPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const electionContext = await getElectionBySlug(slug);
  const electionId = electionContext.id;
  const election = await getElectionStatus(electionId);

  const config = await prisma.electionConfig.findUnique({
    where: { electionId }
  });

  // Also fetch description from Election table
  const electionRecord = await prisma.election.findUnique({
    where: { id: electionId },
    select: { description: true }
  });

  return (
    <div className="px-4 py-6 md:p-8 max-w-3xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900 mb-2">Election Configuration</h1>
        <p className="text-surface-600">
          Set the voting window, provide instructions for voters, and configure results visibility.
        </p>
      </div>

      <ConfigManager 
        electionId={electionId} 
        initialConfig={config}
        initialDescription={electionRecord?.description || ""}
        isLocked={election.status !== "setup"} 
      />
    </div>
  );
}
