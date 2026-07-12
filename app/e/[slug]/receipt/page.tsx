import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyVoterSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ClipboardList, Check, ArrowLeft } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending_ocr: { label: "Verification in progress", className: "badge-pending" },
  verified: { label: "Verified ✓", className: "badge-success" },
  pending_review: { label: "Under review", className: "badge-pending" },
  flagged_invalid: { label: "Flagged for review", className: "badge-danger" },
  rejected: { label: "Rejected", className: "badge-danger" },
};

export default async function ReceiptPage() {
  const session = await verifyVoterSession();

  if (!session || session.phase !== "receipt") {
    redirect(`/e/${session?.electionSlug || "cesa-2526"}`);
  }

  // Find the voter's PendingVote
  const pendingVote = await prisma.pendingVote.findFirst({
    where: {
      matricNumber: session.matricNumber,
      status: { not: "awaiting_ballot" },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!pendingVote || !pendingVote.choices) {
    redirect(`/e/${session.electionSlug}`);
  }

  // Fetch positions with candidates
  const positions = await prisma.position.findMany({
    where: { electionId: session.electionId },
    orderBy: { order: "asc" },
    include: {
      candidates: {
        orderBy: { name: "asc" },
      },
    },
  });

  const choices = pendingVote.choices as Record<string, string>;
  const status = STATUS_LABELS[pendingVote.status] || STATUS_LABELS.pending_ocr;

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
              width: "64px",
              height: "64px",
              margin: "0 auto 1rem",
              borderRadius: "50%",
              background: "rgba(99,102,241,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.75rem",
            }}
          >
            <ClipboardList size={32} />
          </div>

          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            Your Vote Receipt
          </h1>
          <p
            style={{
              color: "var(--color-surface-600)",
              fontSize: "0.9rem",
              lineHeight: 1.5,
              marginBottom: "1rem",
            }}
          >
            You voted on{" "}
            <strong style={{ color: "var(--color-surface-800)" }}>
              {new Date(pendingVote.createdAt).toLocaleDateString("en-NG", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </strong>
          </p>

          {/* Status Badge */}
          <span className={`badge ${status.className}`}>
            {status.label}
          </span>
        </div>

        {/* Selections */}
        <div
          className="stagger-children"
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          {positions.map((position) => {
            const selectedCandidateId = choices[position.id];

            return (
              <div
                key={position.id}
                className="glass-card"
                style={{ padding: "1.25rem" }}
              >
                <h2
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--color-surface-500)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.875rem",
                  }}
                >
                  {position.title}
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {position.candidates.map((candidate) => {
                    const isSelected = candidate.id === selectedCandidateId;

                    return (
                      <div
                        key={candidate.id}
                        className={isSelected ? "receipt-selected" : "receipt-unselected"}
                        style={{
                          padding: "0.875rem 1rem",
                          borderRadius: "0.75rem",
                          border: "1px solid var(--color-surface-200)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          transition: "all 0.3s",
                        }}
                      >
                        {/* Avatar */}
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "0.625rem",
                            background: isSelected
                              ? "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-400))"
                              : "var(--color-surface-50)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1rem",
                            fontWeight: 700,
                            flexShrink: 0,
                            color: "#fff",
                          }}
                        >
                          {candidate.photoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={candidate.photoUrl}
                              alt={candidate.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: "0.625rem",
                              }}
                            />
                          ) : (
                            candidate.name.charAt(0)
                          )}
                        </div>

                        {/* Name */}
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontWeight: isSelected ? 600 : 400,
                              fontSize: "0.9375rem",
                              color: isSelected ? "var(--color-surface-900)" : "var(--color-surface-500)",
                            }}
                          >
                            {candidate.name}
                          </div>
                          {candidate.manifesto && (
                            <p
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--color-surface-400)",
                                lineHeight: 1.4,
                                marginTop: "0.125rem",
                                display: "-webkit-box",
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {candidate.manifesto}
                            </p>
                          )}
                        </div>

                        {/* Selected indicator */}
                        {isSelected && (
                          <div
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              background: "var(--color-primary-500)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              flexShrink: 0,
                              color: "#fff",
                            }}
                          >
                            <Check size={16} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <Link
            href={`/e/${session.electionSlug}`}
            className="btn-secondary"
            style={{
              textDecoration: "none",
              display: "inline-flex",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><ArrowLeft size={16} /> Return to Home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
