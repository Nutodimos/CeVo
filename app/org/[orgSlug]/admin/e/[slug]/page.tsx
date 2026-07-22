import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { Upload, UserPlus, ListTodo, CalendarClock, CheckCircle } from "lucide-react";
import { getElectionStatus } from "@/lib/election";
import { getElectionBySlug } from "@/lib/election-context";
import SetupChecklist from "./SetupChecklist";
import LiveDashboard from "./LiveDashboard";
import PostCloseDashboard from "./PostCloseDashboard";
import VoterLinkCard from "./VoterLinkCard";
import DeleteElectionButton from "./DeleteElectionButton";

export default async function AdminDashboard({ params }: { params: Promise<{ orgSlug: string; slug: string }> }) {
  const admin = await verifyAdminSession();
  if (!admin) {
    redirect("/admin/login");
  }

  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const orgSlug = resolvedParams.orgSlug;
  const electionContext = await getElectionBySlug(slug);
  const electionId = electionContext.id;
  const election = await getElectionStatus(electionId);
  const isSuperAdmin = admin.role === "super_admin";

  // Check admin role
  let isElectionAdmin = isSuperAdmin;
  if (!isElectionAdmin) {
    const orgMember = await prisma.orgMember.findFirst({
      where: {
        organisation: { slug: orgSlug },
        adminUserId: admin.adminId,
        role: "org_admin"
      }
    });
    isElectionAdmin = !!orgMember;
  }

  // If status is setup and user is admin, show setup checklist
  if (election.status === "setup") {
    if (!isElectionAdmin) {
      redirect(`/org/${orgSlug}/admin/e/${slug}/review`);
    }

    const [voterCount, positionsCount, candidatesCount, config] = await Promise.all([
      prisma.voterRoll.count({ where: { electionId } }),
      prisma.position.count({ where: { electionId } }),
      prisma.candidate.count({ where: { position: { electionId } } }),
      prisma.electionConfig.findUnique({ where: { electionId } })
    ]);

    const checklist = [
      { id: 'voters', label: "Upload Voter Roll", completed: voterCount > 0, href: `/org/${orgSlug}/admin/e/${slug}/setup/voters`, icon: <Upload size={18} /> },
      { id: 'positions', label: "Create Positions", completed: positionsCount > 0, href: `/org/${orgSlug}/admin/e/${slug}/setup/positions`, icon: <ListTodo size={18} /> },
      { id: 'candidates', label: "Add Candidates", completed: candidatesCount > 0, href: `/org/${orgSlug}/admin/e/${slug}/setup/positions`, icon: <UserPlus size={18} /> },
      { id: 'config', label: "Set Election Window", completed: !!config, href: `/org/${orgSlug}/admin/e/${slug}/setup/config`, icon: <CalendarClock size={18} /> },
      { id: 'preview', label: "Preview Ballot", completed: !!config?.previewedAt, href: `/org/${orgSlug}/admin/e/${slug}/setup/preview`, icon: <CheckCircle size={18} /> },
    ];

    return (
      <div className="px-4 py-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-end mb-4">
            {isSuperAdmin && <DeleteElectionButton electionId={electionId} orgSlug={orgSlug} />}
          </div>
          <VoterLinkCard slug={slug} />
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2 text-surface-900">Election Setup</h1>
            <p className="text-surface-600">Complete these steps to prepare the election before going live.</p>
          </div>
          <SetupChecklist electionId={electionId} checklist={checklist} />
        </div>
      </div>
    );
  }

  // Live Dashboard
  if (election.status === "active") {
    return (
      <div className="px-4 py-6 md:p-8 md:pb-0">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-end mb-4">
            {isSuperAdmin && <DeleteElectionButton electionId={electionId} orgSlug={orgSlug} />}
          </div>
          <VoterLinkCard slug={slug} />
        </div>
        <LiveDashboard electionId={electionId} electionSlug={slug} orgSlug={orgSlug} />
      </div>
    );
  }

  // Post-Close Workflow (status === "closed" || status === "certified")
  const [pending, review, flagged, verified] = await Promise.all([
    prisma.pendingVote.count({ where: { electionId, status: "pending_ocr" } }),
    prisma.pendingVote.count({ where: { electionId, status: "pending_review" } }),
    prisma.pendingVote.count({ where: { electionId, status: "flagged_invalid" } }),
    prisma.pendingVote.count({ where: { electionId, status: "verified" } })
  ]);

  let adminPreviewResults: any[] = [];
  if (!election.resultsPublished) {
    // Basic tally computation for admin preview
    let positions = await prisma.position.findMany({
      where: { electionId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        candidates: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    const voteCounts = await prisma.vote.groupBy({
      by: ['candidateId'],
      _count: { candidateId: true },
      where: { electionId }
    });
    
    const countMap = Object.fromEntries(voteCounts.map(v => [v.candidateId, v._count.candidateId]));

    adminPreviewResults = positions.map(p => ({
      ...p,
      candidates: p.candidates.map(c => ({
        ...c,
        votes: countMap[c.id] || 0
      }))
    }));
  }

  return (
    <>
      <div className="px-4 py-6 md:p-8 md:pb-0">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-end mb-4">
            {isSuperAdmin && <DeleteElectionButton electionId={electionId} orgSlug={orgSlug} />}
          </div>
          <VoterLinkCard slug={slug} />
        </div>
      </div>
      <PostCloseDashboard 
        electionId={electionId}
        electionSlug={slug}
        orgSlug={orgSlug}
        isSuperAdmin={isSuperAdmin}
        status={election.status}
        resultsPublished={election.resultsPublished}
        ocrCounts={{ pending, review, flagged, verified }}
        adminPreviewResults={adminPreviewResults}
      />
    </>
  );
}
