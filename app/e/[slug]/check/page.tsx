import { getElectionBySlug } from "@/lib/election-context";
import type { Metadata } from "next";
import EligibilityCheckForm from "./EligibilityCheckForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const election = await getElectionBySlug(resolvedParams.slug);

  return {
    title: `Eligibility Check | ${election.name} — CeVo`,
  };
}

export default async function EligibilityCheckPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const election = await getElectionBySlug(slug);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-surface-200 overflow-hidden text-center p-8 animate-fade-in-up">
        
        <div className="flex justify-start mb-6">
          <Link 
            href={`/e/${slug}`}
            className="flex items-center text-sm font-medium text-surface-500 hover:text-surface-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Election
          </Link>
        </div>

        <EligibilityCheckForm electionId={election.id} electionSlug={slug} />
        
      </div>
    </main>
  );
}
