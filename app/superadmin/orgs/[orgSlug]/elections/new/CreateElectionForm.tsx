"use client";

import { useActionState } from "react";
import { createElection } from "@/app/actions/superadmin";
import { Plus } from "lucide-react";

export default function CreateElectionForm({ organisationId, orgSlug }: { organisationId: string; orgSlug: string }) {
  const [state, formAction, isPending] = useActionState(createElection, null);

  return (
    <form action={formAction} className="bg-card border border-white/10 rounded-xl p-6 space-y-6">
      <input type="hidden" name="organisationId" value={organisationId} />

      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1">Election Name *</label>
        <input name="name" type="text" required className="input-field" placeholder="e.g. CESA Elections 2025/2026" />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1">URL Slug *</label>
        <input name="slug" type="text" required className="input-field" placeholder="e.g. cesa-2526" pattern="^[a-z0-9-]+$" />
        <p className="text-xs text-foreground/50 mt-1">Voters access at /e/slug — lowercase, numbers, hyphens</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1">Description</label>
        <textarea name="description" className="input-field" rows={3} placeholder="Optional description" />
      </div>

      {state?.error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm">
          {state.error}
        </div>
      )}

      <button type="submit" disabled={isPending} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" />
        {isPending ? "Creating..." : "Create Election"}
      </button>
    </form>
  );
}
