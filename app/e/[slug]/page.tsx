import { getElectionBySlug } from "@/lib/election-context";
import { getElectionStatus } from "@/lib/election";
import { prisma } from "@/lib/prisma";
import LandingForm from "./LandingForm";
import ResultsView from "./ResultsView";
import Link from "next/link";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const election = await getElectionBySlug(resolvedParams.slug);
  const config = await prisma.electionConfig.findUnique({ where: { electionId: election.id } });

  let description = "Cast your vote on CeVo";
  if (config) {
    const openDate = new Date(config.opensAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const closeDate = new Date(config.closesAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    description = `Cast your vote — ${openDate} to ${closeDate}`;
  }

  return {
    title: `${election.name} — CeVo`,
    openGraph: {
      title: election.name,
      description,
      siteName: "CeVo Platform",
    },
  };
}

export default async function ElectionLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const election = await getElectionBySlug(slug);
  const statusRes = await getElectionStatus(election.id);
  const config = await prisma.electionConfig.findUnique({ where: { electionId: election.id } });

  // Helper formatting
  const formatDate = (date?: Date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      timeZoneName: "short"
    }).format(date);
  };

  const PageContainer = ({ children }: { children: React.ReactNode }) => (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-surface-200 overflow-hidden text-center p-8 animate-fade-in-up">
        {election.organisation?.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={election.organisation.logoUrl} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-6 rounded-lg" />
        )}
        {children}
      </div>
      <div className="mt-8 text-center text-sm text-surface-500 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
        <Link href="/elections" className="hover:text-surface-900 transition-colors font-medium">
          View Past Elections Archive
        </Link>
      </div>
    </main>
  );

  // 1. Setup / Before Window
  if (statusRes.status === "setup" || (statusRes.status === "active" && !statusRes.isOpen && config && new Date() < config.opensAt)) {
    return (
      <PageContainer>
        {!election.organisation?.logoUrl && <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">⏳</div>}
        <h1 className="text-2xl font-bold text-surface-900 mb-2">{election.name}</h1>
        <p className="text-surface-600 mb-6 font-medium">Voting hasn't opened yet</p>
        
        <div className="bg-surface-50 border border-surface-200 rounded-xl p-4">
          {config?.opensAt ? (
            <>
              <div className="text-xs uppercase font-bold text-surface-400 mb-1">Voting Opens</div>
              <div className="text-surface-900 font-medium mb-4">{formatDate(config.opensAt)}</div>
            </>
          ) : (
            <div className="text-surface-600 mb-4">Opening time will be announced soon</div>
          )}
          <Link 
            href={`/e/${slug}/check`}
            className="block w-full py-2 px-4 bg-white border border-surface-200 rounded-lg text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors"
          >
            Check your registration
          </Link>
        </div>
      </PageContainer>
    );
  }

  // 2. Active & Inside Window
  if (statusRes.isOpen) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-50">
        <LandingForm electionId={election.id} electionSlug={election.slug} orgLogoUrl={election.organisation?.logoUrl} />
        <div className="mt-8 text-center text-sm text-surface-500 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <Link href="/elections" className="hover:text-surface-900 transition-colors font-medium">
            View Past Elections Archive
          </Link>
        </div>
      </main>
    );
  }

  // 3. Active but Outside Window (After window)
  if (statusRes.status === "active" && !statusRes.isOpen && config && new Date() > config.closesAt) {
    return (
      <PageContainer>
        {!election.organisation?.logoUrl && <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">🛑</div>}
        <h1 className="text-2xl font-bold text-surface-900 mb-2">{election.name}</h1>
        <p className="text-surface-600 mb-6 font-medium">Voting has ended</p>
        <p className="text-sm text-surface-500">Results will be published soon.</p>
      </PageContainer>
    );
  }

  // 4. Closed (Results not published)
  if ((statusRes.status === "closed" || statusRes.status === "certified") && !statusRes.resultsPublished) {
    const turnout = await prisma.voterRoll.count({ where: { electionId: election.id, hasVoted: true } });
    return (
      <PageContainer>
        {!election.organisation?.logoUrl && <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">🔒</div>}
        <h1 className="text-2xl font-bold text-surface-900 mb-2">{election.name}</h1>
        <p className="text-surface-600 mb-4 font-medium">Voting has ended</p>
        <div className="bg-primary-50 text-primary-700 px-4 py-2 rounded-lg text-sm font-semibold mb-6 inline-block">
          {turnout} students voted
        </div>
        <p className="text-sm text-surface-500">Results are being reviewed and will be published here soon.</p>
      </PageContainer>
    );
  }

  // 5. Closed/Certified (Results published)
  if (statusRes.resultsPublished) {
    const [totalRegistered, totalVoted] = await Promise.all([
      prisma.voterRoll.count({ where: { electionId: election.id } }),
      prisma.voterRoll.count({ where: { electionId: election.id, hasVoted: true } })
    ]);

    const positionsData = await prisma.position.findMany({
      where: { electionId: election.id },
      orderBy: { order: "asc" },
      include: {
        candidates: {
          orderBy: { order: "asc" }
        }
      }
    });

    const voteCounts = await prisma.vote.groupBy({
      by: ['candidateId'],
      _count: { candidateId: true },
      where: { electionId: election.id }
    });
    
    const countMap = Object.fromEntries(voteCounts.map(v => [v.candidateId, v._count.candidateId]));

    const positions = positionsData.map(p => {
      let maxVotes = -1;
      const candidates = p.candidates.map(c => {
        const votes = countMap[c.id] || 0;
        if (votes > maxVotes) maxVotes = votes;
        return { name: c.name, votes };
      });
      
      return {
        title: p.title,
        candidates: candidates.map(c => ({
          ...c,
          isWinner: c.votes > 0 && c.votes === maxVotes // Can be a tie, all top get isWinner
        }))
      };
    });

    const resultsData = {
      electionName: election.name,
      slug,
      openedAt: config?.opensAt ? formatDate(config.opensAt) : "",
      closedAt: config?.closesAt ? formatDate(config.closesAt) : "",
      totalRegistered,
      totalVoted,
      positions
    };

    return (
      <main className="min-h-screen bg-surface-100 py-12 px-4 sm:px-6">
        <ResultsView data={resultsData} />
        <div className="mt-12 text-center text-sm text-surface-500 pb-8 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <Link href="/elections" className="hover:text-surface-900 transition-colors font-medium">
            View Past Elections Archive
          </Link>
        </div>
      </main>
    );
  }

  // Fallback
  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-surface-900 mb-2">{election.name}</h1>
      <p className="text-surface-600">Please check back later.</p>
    </PageContainer>
  );
}
