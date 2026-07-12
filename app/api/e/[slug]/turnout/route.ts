import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { getElectionBySlug } from "@/lib/election-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  // Turnout data is sensitive during an active election (can influence late voters).
  // Require an authenticated admin session.
  const admin = await verifyAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  try {
    const election = await getElectionBySlug(slug);

    // Verify the admin has access to this election (or is super_admin)
    if (admin.role !== "super_admin") {
      const orgMember = await prisma.orgMember.findFirst({
        where: {
          organisationId: election.organisationId,
          adminUserId: admin.adminId,
          role: "org_admin"
        }
      });
      if (!orgMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const [totalVoters, hasVotedCount, pendingVotesCount] = await Promise.all([
      prisma.voterRoll.count({ where: { electionId: election.id } }),
      prisma.voterRoll.count({ where: { electionId: election.id, hasVoted: true } }),
      prisma.pendingVote.count({ where: { electionId: election.id, status: { not: "rejected" } } })
    ]);
    
    const votedCount = hasVotedCount + pendingVotesCount;

    return NextResponse.json({
      total: totalVoters,
      voted: votedCount,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch turnout" }, { status: 500 });
  }
}
