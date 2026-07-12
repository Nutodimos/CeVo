import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin-auth";
import { getElectionBySlug } from "@/lib/election-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { slug } = await params;
    const election = await getElectionBySlug(slug);

    if (admin.role !== "super_admin") {
      const orgMember = await prisma.orgMember.findFirst({
        where: {
          organisationId: election.organisationId,
          adminUserId: admin.adminId,
          role: "org_admin"
        }
      });
      if (!orgMember) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    const electionRecord = await prisma.election.findUnique({
      where: { id: election.id },
      include: { config: true }
    });

    if (!electionRecord) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Turnout
    const [totalVoters, hasVotedCount, pendingVotesCount] = await Promise.all([
      prisma.voterRoll.count({ where: { electionId: election.id } }),
      prisma.voterRoll.count({ where: { electionId: election.id, hasVoted: true } }),
      prisma.pendingVote.count({ where: { electionId: election.id, status: { not: "rejected" } } })
    ]);
    
    const votedCount = hasVotedCount + pendingVotesCount;

    // Verification status
    const [pending, verified, review, flagged, rejected] = await Promise.all([
      prisma.pendingVote.count({ where: { electionId: election.id, status: "pending_ocr" } }),
      prisma.pendingVote.count({ where: { electionId: election.id, status: "verified" } }),
      prisma.pendingVote.count({ where: { electionId: election.id, status: "pending_review" } }),
      prisma.pendingVote.count({ where: { electionId: election.id, status: "flagged_invalid" } }),
      prisma.pendingVote.count({ where: { electionId: election.id, status: "rejected" } })
    ]);

    // Turnout by level
    const voters = await prisma.voterRoll.findMany({
      where: { electionId: election.id },
      select: { matricNumber: true, level: true, hasVoted: true }
    });

    const pendingVotes = await prisma.pendingVote.findMany({
      where: { electionId: election.id, status: { not: "rejected" } },
      select: { matricNumber: true }
    });
    const pendingSet = new Set(pendingVotes.map(v => v.matricNumber));

    const byLevelMap: Record<string, { voted: number; registered: number }> = {};
    for (const v of voters) {
      const level = v.level || "Unknown";
      if (!byLevelMap[level]) byLevelMap[level] = { voted: 0, registered: 0 };
      byLevelMap[level].registered++;
      if (v.hasVoted || pendingSet.has(v.matricNumber)) byLevelMap[level].voted++;
    }

    const byLevel = Object.entries(byLevelMap).map(([level, stats]) => ({
      level,
      voted: stats.voted,
      registered: stats.registered
    }));

    // Turnout over time
    // We proxy it by counting the `castAt` times from the Vote table.
    // For simplicity, we just fetch all votes and group by hour.
    const votes = await prisma.vote.findMany({
      where: { electionId: election.id },
      select: { castAt: true },
      orderBy: { castAt: "asc" }
    });

    // We only want the total votes cast per distinct time bucket.
    // Since votes are anonymous, multiple votes cast by ONE voter might be recorded here if there are multiple positions.
    // However, as an approximation for turnout over time, we can group by hour and divide by number of positions, 
    // OR just use `PendingVote.createdAt` to track *submissions* instead of individual ballot choices.
    // Wait, PendingVote tracks the submission wrapper! PendingVote.createdAt is the exact time they submitted their ballot.
    // Yes, PendingVote is perfect for this.
    const submissions = await prisma.pendingVote.findMany({
      where: { electionId: election.id },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" }
    });

    const overTimeMap: Record<string, number> = {};
    let cumulative = 0;
    
    // Initialize map if election is open
    if (electionRecord.config?.opensAt) {
      const start = new Date(electionRecord.config.opensAt);
      const now = new Date();
      // Create buckets for every hour from opensAt to now
      for (let d = new Date(start); d <= now; d.setHours(d.getHours() + 1)) {
        const hourKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:00`;
        overTimeMap[hourKey] = cumulative;
      }
    }

    for (const sub of submissions) {
      cumulative++;
      const d = sub.createdAt;
      const hourKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:00`;
      overTimeMap[hourKey] = cumulative; // overriding with latest cumulative for that hour
    }

    // Ensure monotonically increasing if some buckets had no submissions
    let lastCum = 0;
    const overTime = Object.keys(overTimeMap).sort().map(time => {
      lastCum = Math.max(lastCum, overTimeMap[time]);
      return { time, votes: lastCum };
    });

    return NextResponse.json({
      turnout: {
        voted: votedCount,
        total: totalVoters,
        percent: totalVoters > 0 ? Math.round((votedCount / totalVoters) * 100) : 0
      },
      byLevel,
      overTime,
      verification: { pending, verified, review, flagged, rejected },
      election: {
        status: electionRecord.status,
        opensAt: electionRecord.config?.opensAt,
        closesAt: electionRecord.config?.closesAt
      }
    });
  } catch (error: any) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
