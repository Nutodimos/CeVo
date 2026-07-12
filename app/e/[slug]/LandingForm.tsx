"use client";

import { useActionState } from "react";
import { checkMatricNumber, type VoterCheckResult } from "@/app/actions/voter";
import { UserCircle } from "lucide-react";

export default function LandingForm({ electionId, electionSlug, orgLogoUrl }: { electionId: string, electionSlug: string, orgLogoUrl?: string | null }) {
  const [state, formAction, isPending] = useActionState<VoterCheckResult | null, FormData>(
    checkMatricNumber,
    null
  );

  return (
    <div
      className="animate-fade-in-up"
      style={{ width: "100%", maxWidth: "440px", textAlign: "center" }}
    >
      <div
        style={{
          width: "64px",
          height: "64px",
          margin: "0 auto 1.25rem",
          borderRadius: "1rem",
          background: orgLogoUrl ? "transparent" : "linear-gradient(135deg, var(--color-surface-100), var(--color-surface-200))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          border: orgLogoUrl ? "none" : "1px solid var(--color-surface-300)",
          color: "var(--color-surface-900)",
        }}
      >
        {orgLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={orgLogoUrl} alt="Organisation Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <UserCircle size={32} />
        )}
      </div>

      <h1
        style={{
          fontSize: "1.75rem",
          fontWeight: 800,
          marginBottom: "0.5rem",
          letterSpacing: "-0.025em",
        }}
      >
        Student Verification
      </h1>
      <p
        style={{
          color: "var(--color-surface-600)",
          fontSize: "0.9375rem",
          marginBottom: "2rem",
          lineHeight: 1.5,
        }}
      >
        Enter your Matriculation Number to begin.
      </p>

      <div className="glass-card" style={{ padding: "2rem" }}>
        <form action={formAction}>
          <input type="hidden" name="electionId" value={electionId} />
          <input type="hidden" name="electionSlug" value={electionSlug} />
          
          <input
            id="matricNumber"
            name="matricNumber"
            type="text"
            className="input-field"
            placeholder="e.g. 20/30GP000"
            autoComplete="off"
            autoFocus
            required
            disabled={isPending}
            style={{
              textTransform: "uppercase",
              marginBottom: "1.25rem",
            }}
          />

          {state?.error && (
            <div
              className="animate-slide-down"
              style={{
                padding: "0.75rem 1rem",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                borderRadius: "0.75rem",
                color: "#fca5a5",
                fontSize: "0.8125rem",
                marginBottom: "1.25rem",
              }}
            >
              {state.error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={isPending}
            style={{ width: "100%" }}
          >
            {isPending ? (
              <>
                <div className="spinner" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Continue</span>
            )}
          </button>
        </form>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <a 
          href={`/e/${electionSlug}/check`}
          style={{
            color: "var(--color-surface-600)",
            fontSize: "0.875rem",
            textDecoration: "none",
            fontWeight: 500
          }}
          className="hover:text-primary-600 transition-colors"
        >
          Check your registration status
        </a>
      </div>
    </div>
  );
}
