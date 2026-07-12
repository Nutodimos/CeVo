import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ReviewQueueClient from "./ReviewQueueClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getElectionBySlug } from "@/lib/election-context";

export const dynamic = "force-dynamic";

export default async function AdminReviewPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ status?: string }>;
  params: Promise<{ slug: string; orgSlug: string }>;
}) {
  const admin = await verifyAdminSession();
  if (!admin) {
    redirect("/admin/login");
  }

  const { status } = await searchParams;
  const isRejectedView = status === "rejected";

  const resolvedParams = await params;
  const { slug, orgSlug } = resolvedParams;
  const election = await getElectionBySlug(slug);

  let votes = [];
  if (isRejectedView) {
    votes = await prisma.pendingVote.findMany({
      where: { electionId: election.id, status: "rejected" },
      orderBy: { reviewedAt: "desc" },
      include: { voterRoll: { select: { name: true } } },
    });
  } else {
    votes = await prisma.pendingVote.findMany({
      where: { electionId: election.id, status: { in: ["pending_review", "flagged_invalid"] } },
      orderBy: { createdAt: "asc" }, // Oldest first
      include: { voterRoll: { select: { name: true } } },
    });
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link href={`/org/${orgSlug}/admin/e/${slug}`} className="flex items-center text-sm text-foreground/60 hover:text-foreground mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">
              {isRejectedView ? "Rejected Voters" : "Verification Review Queue"}
            </h1>
            <p className="text-foreground/60">
              {isRejectedView
                ? "Students who need to be contacted to retry the voting process."
                : "Manual verification queue for course forms that failed automatic verification."}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {isRejectedView ? (
              <Link 
                href={`/org/${orgSlug}/admin/e/${slug}/review`}
                className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
              >
                View Review Queue
              </Link>
            ) : (
              <Link 
                href={`/org/${orgSlug}/admin/e/${slug}/review?status=rejected`}
                className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
              >
                View Rejected Voters
              </Link>
            )}
          </div>
        </div>

        {isRejectedView ? (
          <div className="bg-card rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-medium">Matric Number</th>
                  <th className="px-6 py-4 font-medium">Reviewed By</th>
                  <th className="px-6 py-4 font-medium">Reviewed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {votes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-foreground/50">
                      No rejected voters found.
                    </td>
                  </tr>
                ) : (
                  votes.map((vote) => (
                    <tr key={vote.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 font-mono">{vote.matricNumber}</td>
                      <td className="px-6 py-4">{vote.reviewedBy || "Unknown"}</td>
                      <td className="px-6 py-4">
                        {vote.reviewedAt ? new Date(vote.reviewedAt).toLocaleString() : "Unknown"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <ReviewQueueClient initialVotes={votes} electionSlug={slug} />
        )}
      </div>
    </div>
  );
}
