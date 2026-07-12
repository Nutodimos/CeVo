import { redirect } from "next/navigation";
import { verifyVoterSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import BallotForm from "./BallotForm";

export default async function BallotPage() {
  const session = await verifyVoterSession();

  if (!session || session.phase !== "ballot" || !session.pendingVoteId) {
    redirect(`/e/${session?.electionSlug || "cesa-2526"}`);
  }

  // Fetch all positions with candidates, ordered
  const positions = await prisma.position.findMany({
    where: { electionId: session.electionId },
    orderBy: { order: "asc" },
    include: {
      candidates: {
        orderBy: { name: "asc" },
      },
    },
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1.5rem",
        paddingTop: "2rem",
        paddingBottom: "3rem",
      }}
    >
      <div
        className="animate-fade-in-up"
        style={{ width: "100%", maxWidth: "600px" }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.25)",
              borderRadius: "999px",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--color-primary-300)",
              marginBottom: "1rem",
            }}
          >
            <span>🗳️</span> Step 2 of 2
          </div>

          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            Cast Your Vote
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "0.9rem",
              lineHeight: 1.5,
            }}
          >
            Select one candidate for each position below.
          </p>
        </div>

        <BallotForm positions={positions} />
      </div>
    </main>
  );
}
