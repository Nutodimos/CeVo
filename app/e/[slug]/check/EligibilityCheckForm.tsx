"use client";

import { useActionState } from "react";
import { checkEligibility, type EligibilityCheckResult } from "@/app/actions/check-eligibility";
import { ClipboardCheck, CheckCircle2, XCircle, AlertCircle, ExternalLink } from "lucide-react";

export default function EligibilityCheckForm({ electionId, electionSlug }: { electionId: string, electionSlug: string }) {
  const [state, formAction, isPending] = useActionState<EligibilityCheckResult | null, FormData>(
    checkEligibility,
    null
  );

  if (state?.success && state.status) {
    let icon;
    let bgColor;
    let textColor;
    let borderColor;

    if (state.status === "found_unvoted") {
      icon = <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />;
      bgColor = "bg-emerald-50";
      textColor = "text-emerald-800";
      borderColor = "border-emerald-200";
    } else if (state.status === "found_voted") {
      icon = <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />;
      bgColor = "bg-amber-50";
      textColor = "text-amber-800";
      borderColor = "border-amber-200";
    } else {
      icon = <XCircle className="w-12 h-12 text-rose-500 mb-4" />;
      bgColor = "bg-rose-50";
      textColor = "text-rose-800";
      borderColor = "border-rose-200";
    }

    return (
      <div className="flex flex-col items-center animate-fade-in-up">
        {icon}
        <h2 className="text-xl font-bold text-surface-900 mb-2">Eligibility Status</h2>
        
        <div className={`p-4 rounded-xl border ${bgColor} ${borderColor} ${textColor} mb-6 w-full`}>
          <p className="text-sm font-medium">{state.message}</p>
        </div>

        {state.status === "not_found" && state.adminContact && (
          <div className="mb-6 w-full text-left">
            <p className="text-sm text-surface-600 mb-2">Need help? Contact the electoral admin:</p>
            <a 
              href={state.adminContact.startsWith("http") ? state.adminContact : (state.adminContact.includes("@") ? `mailto:${state.adminContact}` : `https://${state.adminContact}`)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg font-medium transition-colors border border-primary-200"
            >
              Contact Admin
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        <button 
          onClick={() => window.location.reload()} 
          className="btn-secondary w-full"
        >
          Check Another
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 text-primary-600 mb-6 border border-primary-100"
      >
        <ClipboardCheck className="w-8 h-8" />
      </div>

      <h1 className="text-2xl font-bold text-surface-900 mb-2">
        Eligibility Check
      </h1>
      <p className="text-surface-600 text-sm mb-8">
        Enter your Matriculation Number to see if you are registered to vote.
      </p>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="electionId" value={electionId} />
        
        <div className="text-left">
          <label htmlFor="matricNumber" className="block text-sm font-medium text-surface-700 mb-1">
            Matriculation Number
          </label>
          <input
            id="matricNumber"
            name="matricNumber"
            type="text"
            className="input-field uppercase"
            placeholder="e.g. 20/30GP000"
            autoComplete="off"
            required
            disabled={isPending}
          />
        </div>

        {state?.error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 border border-red-100 text-sm animate-slide-down">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <div className="spinner w-4 h-4 border-2" />
              <span>Checking...</span>
            </>
          ) : (
            <span>Check Status</span>
          )}
        </button>
      </form>
    </>
  );
}
