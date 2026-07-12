"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

export default function LiveTurnout({
  initialTotal,
  initialVoted,
}: {
  initialTotal: number;
  initialVoted: number;
}) {
  const [stats, setStats] = useState({ total: initialTotal, voted: initialVoted });

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/turnout");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch turnout:", err);
      }
    }, 30000); // poll every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const turnoutPercent =
    stats.total > 0 ? Math.round((stats.voted / stats.total) * 100) : 0;

  return (
    <div className="glass-card" style={{ padding: "3rem 2rem", textAlign: "center" }}>
      <div
        style={{
          width: "64px",
          height: "64px",
          margin: "0 auto 1.5rem",
          borderRadius: "1rem",
          background: "linear-gradient(135deg, var(--color-primary-100), var(--color-primary-200))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-primary-700)",
        }}
      >
        <Users size={32} />
      </div>

      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Live Election Turnout
      </h2>
      <p style={{ color: "var(--color-surface-600)", marginBottom: "2rem" }}>
        Real-time count of successfully tallied votes.
      </p>

      <div style={{ marginBottom: "1rem" }}>
        <span
          style={{
            fontSize: "3.5rem",
            fontWeight: 800,
            lineHeight: 1,
            color: "var(--color-primary-600)",
          }}
        >
          {stats.voted}
        </span>
        <span style={{ fontSize: "1.5rem", color: "var(--color-surface-400)", margin: "0 0.5rem" }}>
          /
        </span>
        <span style={{ fontSize: "2rem", fontWeight: 600, color: "var(--color-surface-600)" }}>
          {stats.total}
        </span>
      </div>

      <div
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "var(--color-surface-500)",
          marginBottom: "2rem",
        }}
      >
        {turnoutPercent}% Turnout
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: "100%",
          height: "12px",
          background: "var(--color-surface-200)",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${turnoutPercent}%`,
            background: "linear-gradient(90deg, var(--color-primary-500), var(--color-primary-400))",
            transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  );
}
