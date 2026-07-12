"use client";

import { useState } from "react";
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

export default function PreviewBallotForm({ positions }: Props) {
  const [selections, setSelections] = useState<Record<string, string>>({});

  const handleSelect = (positionId: string, candidateId: string) => {
    setSelections((prev) => ({ ...prev, [positionId]: candidateId }));
  };

  return (
    <>
      <div className="stagger-children" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {positions.map((position) => (
          <div key={position.id} className="glass-card" style={{ padding: "1.5rem", background: "rgba(30, 41, 59, 0.7)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.25rem", color: "#fff" }}>
              {position.title}
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-surface-400)", marginBottom: "1rem" }}>
              Select one candidate
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {position.candidates.map((candidate) => (
                <label key={candidate.id} className="candidate-card" style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <input
                    type="radio"
                    name={`position-${position.id}`}
                    value={candidate.id}
                    checked={selections[position.id] === candidate.id}
                    onChange={() => handleSelect(position.id, candidate.id)}
                  />
                  <div className="card-inner">
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "0.75rem", background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-400))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", fontWeight: 700, flexShrink: 0, color: "#fff" }}>
                        {candidate.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={candidate.photoUrl} alt={candidate.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "0.75rem" }} />
                        ) : (
                          candidate.name.charAt(0)
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.9375rem", marginBottom: "0.25rem", color: "#e2e8f0" }}>
                          {candidate.name}
                        </div>
                        {candidate.manifesto && (
                          <p style={{ fontSize: "0.8125rem", color: "var(--color-surface-400)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {candidate.manifesto}
                          </p>
                        )}
                      </div>
                      <div className="check-indicator" />
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <button className="btn-primary" disabled style={{ width: "100%", opacity: 0.7, cursor: "not-allowed" }}>
          <span>Preview only — voting not open yet</span>
        </button>
      </div>
    </>
  );
}
