import { prisma } from "@/lib/prisma";
import { getElectionBySlug } from "@/lib/election-context";
import { markPreviewed } from "@/app/actions/setup";
import PreviewBallotForm from "./PreviewBallotForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function PreviewSetupPage({ params }: { params: Promise<{ slug: string; orgSlug: string }> }) {
  const resolvedParams = await params;
  const { slug, orgSlug } = resolvedParams;
  const electionContext = await getElectionBySlug(slug);
  const electionId = electionContext.id;

  // Mark as previewed if it's the first time
  await markPreviewed(electionId);

  const positions = await prisma.position.findMany({
    where: { electionId },
    orderBy: { order: "asc" },
    include: {
      candidates: {
        orderBy: { order: "asc" }
      }
    }
  });

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 animate-fade-in-up bg-[#0f172a]">
      {/* Watermark overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center opacity-10 overflow-hidden">
        <div className="transform -rotate-45 text-[8vw] font-black tracking-widest text-white whitespace-nowrap">
          PREVIEW — NOT A REAL VOTE
        </div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <Link 
            href={`/org/${orgSlug}/admin/e/${slug}`} 
            className="text-primary-400 hover:text-primary-300 font-medium flex items-center gap-2 text-sm w-fit transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Setup
          </Link>
          <div className="bg-amber-500 text-amber-950 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Preview Mode
          </div>
        </div>

        {/* Ballot Header Mock */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">{electionContext.name}</h1>
          <p className="text-surface-400">Please review your candidates carefully.</p>
        </div>

        {positions.length === 0 ? (
          <div className="bg-surface-800 border border-surface-700 rounded-2xl p-12 text-center text-surface-400">
            No positions or candidates added yet. Add them in setup to preview the ballot.
          </div>
        ) : (
          <PreviewBallotForm positions={positions} />
        )}
      </div>
    </div>
  );
}
