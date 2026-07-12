"use client";

import { useActionState } from "react";
import { createElectionAsOrgAdmin } from "@/app/actions/org";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";

export default function NewElectionPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const resolvedParams = use(params);
  const orgSlug = resolvedParams.orgSlug;
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await createElectionAsOrgAdmin(
        orgSlug,
        formData.get("name") as string,
        formData.get("slug") as string,
        formData.get("description") as string
      );
      if (res.success) {
        router.push(`/org/${orgSlug}/admin/e/${res.slug}`);
      }
      return res;
    },
    null
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Create Election</h1>
        <p className="text-surface-600 mt-1">Set up a new election for your organisation.</p>
      </div>

      <form action={formAction} className="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Election Name *</label>
          <input name="name" type="text" required className="input-field w-full" placeholder="e.g. CESA Elections 2025/2026" />
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">URL Slug *</label>
          <input name="slug" type="text" required className="input-field w-full" placeholder="e.g. cesa-2526" pattern="^[a-z0-9-]+$" />
          <p className="text-xs text-surface-500 mt-1">Voters access at /e/slug — lowercase, numbers, hyphens</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
          <textarea name="description" className="input-field w-full" rows={3} placeholder="Optional description" />
        </div>

        {state?.error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
            {state.error}
          </div>
        )}

        <button type="submit" disabled={isPending} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />
          {isPending ? "Creating..." : "Create Election"}
        </button>
      </form>
    </div>
  );
}
