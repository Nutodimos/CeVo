import Link from "next/link";

import { use } from "react";

export default function ConfirmationPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        className="animate-fade-in-up"
        style={{
          width: "100%",
          maxWidth: "440px",
          textAlign: "center",
        }}
      >
        {/* Success Checkmark */}
        <div
          style={{
            position: "relative",
            width: "100px",
            height: "100px",
            margin: "0 auto 2rem",
          }}
        >
          <svg
            className="success-checkmark"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="check-circle"
              cx="50"
              cy="50"
              r="45"
            />
            <path
              className="check-path"
              d="M30 52 L44 66 L70 38"
            />
          </svg>
          <div className="success-ring" />
        </div>

        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            marginBottom: "0.75rem",
            background: "linear-gradient(135deg, #34d399 0%, #6ee7b7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Vote Submitted!
        </h1>

        <p
          style={{
            color: "var(--color-surface-600)",
            fontSize: "1rem",
            lineHeight: 1.7,
            marginBottom: "2rem",
          }}
        >
          Your vote has been securely recorded.
          <br />
          Thank you for participating in the CESA election.
        </p>

        <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem",
              background: "rgba(52,211,153,0.08)",
              borderRadius: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <span
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(52,211,153,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.1rem",
                flexShrink: 0,
              }}
            >
              🔒
            </span>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-surface-700)",
                lineHeight: 1.5,
                textAlign: "left",
              }}
            >
              Your vote is anonymous. Your identity verification happens separately from your ballot choices.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem",
              background: "rgba(99,102,241,0.08)",
              borderRadius: "0.75rem",
            }}
          >
            <span
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(99,102,241,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.1rem",
                flexShrink: 0,
              }}
            >
              ⏱️
            </span>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-surface-700)",
                lineHeight: 1.5,
                textAlign: "left",
              }}
            >
              Your course form will be verified shortly. No further action is needed from you.
            </p>
          </div>
        </div>

        <Link
          href={`/e/${slug}`}
          className="btn-secondary"
          style={{
            textDecoration: "none",
            display: "inline-flex",
          }}
        >
          <span>← Return to Home</span>
        </Link>
      </div>
    </main>
  );
}
