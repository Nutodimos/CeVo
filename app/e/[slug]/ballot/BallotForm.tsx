"use client";

import { useState, useCallback } from "react";
import { submitBallot } from "@/app/actions/ballot";
import { AlertTriangle } from "lucide-react";

type Candidate = {
  id: string;
  name: string;
  photoUrl: string | null;
  manifesto: string | null;
  positionId: string;
};

type Position = {
  id: string;
  title: string;
  order: number;
  candidates: Candidate[];
};

type Props = {
  positions: Position[];
};

export default function BallotForm({ positions }: Props) {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = positions.length > 0 && positions.every((p) => selections[p.id]);

  const handleSelect = useCallback((positionId: string, candidateId: string) => {
    setSelections((prev) => ({ ...prev, [positionId]: candidateId }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitBallot(selections);
      if (!result.success) {
        setError(result.error || "Submission failed. Please try again.");
        setIsSubmitting(false);
        setShowConfirm(false);
      }
      // On success, the server action redirects to /confirmation
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  }, [selections]);

  // Get candidate name from ID for confirmation
  const getCandidateName = (positionId: string) => {
    const position = positions.find((p) => p.id === positionId);
    const candidateId = selections[positionId];
    return position?.candidates.find((c) => c.id === candidateId)?.name || "—";
  };

  return (
    <>
      {/* Position sections */}
      <div className="stagger-children" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {positions.map((position) => (
          <div
            key={position.id}
            className="glass-card"
            style={{ padding: "1.5rem" }}
          >
            <h2
              style={{
                fontSize: "1.125rem",
                fontWeight: 700,
                marginBottom: "0.25rem",
                color: "var(--color-surface-900)",
              }}
            >
              {position.title}
            </h2>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-surface-500)",
                marginBottom: "1rem",
              }}
            >
              Select one candidate
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {position.candidates.map((candidate) => (
                <label key={candidate.id} className="candidate-card">
                  <input
                    type="radio"
                    name={`position-${position.id}`}
                    value={candidate.id}
                    checked={selections[position.id] === candidate.id}
                    onChange={() => handleSelect(position.id, candidate.id)}
                  />
                  <div className="card-inner">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.875rem",
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "0.75rem",
                          background:
                            "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-400))",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.25rem",
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
                              borderRadius: "0.75rem",
                            }}
                          />
                        ) : (
                          candidate.name.charAt(0)
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.9375rem",
                            marginBottom: "0.25rem",
                            color: "var(--color-surface-900)",
                          }}
                        >
                          {candidate.name}
                        </div>
                        {candidate.manifesto && (
                          <p
                            style={{
                              fontSize: "0.8125rem",
                              color: "var(--color-surface-500)",
                              lineHeight: 1.5,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {candidate.manifesto}
                          </p>
                        )}
                      </div>

                      {/* Radio indicator */}
                      <div className="check-indicator" />
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          className="animate-slide-down"
          style={{
            marginTop: "1rem",
            padding: "0.875rem 1rem",
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            borderRadius: "0.75rem",
            color: "#fca5a5",
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div style={{ marginTop: "1.5rem" }}>
        <button
          className="btn-primary"
          disabled={!allSelected}
          onClick={() => setShowConfirm(true)}
          style={{ width: "100%" }}
        >
          <span>Review & Submit Vote</span>
        </button>

        {!allSelected && (
          <p
            style={{
              textAlign: "center",
              fontSize: "0.8125rem",
              color: "var(--color-surface-500)",
              marginTop: "0.75rem",
            }}
          >
            Please select a candidate for every position to continue.
          </p>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ padding: "2rem" }}>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
                textAlign: "center",
              }}
            >
              Confirm Your Vote
            </h2>
            <p
              style={{
                color: "var(--color-surface-600)",
                fontSize: "0.875rem",
                textAlign: "center",
                marginBottom: "1.5rem",
              }}
            >
              Please review your selections. This action cannot be undone.
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              {positions.map((position) => (
                <div
                  key={position.id}
                  className="glass-card-light"
                  style={{ padding: "0.875rem 1rem" }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--color-surface-500)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {position.title}
                  </div>
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "var(--color-primary-300)",
                    }}
                  >
                    {getCandidateName(position.id)}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.625rem",
              }}
            >
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{ width: "100%" }}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Yes, Submit My Vote</span>
                )}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
                style={{ width: "100%" }}
              >
                <span>Go Back & Edit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
