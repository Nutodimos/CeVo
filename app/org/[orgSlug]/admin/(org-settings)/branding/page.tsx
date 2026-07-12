"use client";

import { useActionState } from "react";
import { updateOrgBranding } from "@/app/actions/org";
import { Palette, Upload } from "lucide-react";
import { use } from "react";

export default function OrgBrandingPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const resolvedParams = use(params);
  const orgSlug = resolvedParams.orgSlug;
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      return await updateOrgBranding(orgSlug, {
        name: formData.get("name")?.toString(),
        shortName: formData.get("shortName")?.toString(),
        contactEmail: formData.get("contactEmail")?.toString(),
        primaryColor: formData.get("primaryColor")?.toString(),
        accentColor: formData.get("accentColor")?.toString(),
        // Logo URL would typically be handled via a separate upload component that sets a hidden input
        // For now we'll allow direct URL input or skip it.
      });
    },
    null
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Organisation Branding</h1>
        <p className="text-surface-600 mt-1">Manage how your organisation appears to voters.</p>
      </div>

      <form action={formAction} className="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-surface-900 border-b border-surface-100 pb-2">Basic Info</h3>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Full Name</label>
            <input name="name" type="text" className="input-field w-full" placeholder="Computer Engineering Students' Association" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Short Name</label>
              <input name="shortName" type="text" className="input-field w-full" placeholder="CESA" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Support Email</label>
              <input name="contactEmail" type="email" className="input-field w-full" placeholder="support@cesa.edu" />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-semibold text-surface-900 border-b border-surface-100 pb-2">Theme Colors</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Primary Color</label>
              <div className="flex items-center gap-3 bg-surface-50 p-2 rounded-lg border border-surface-200">
                <input name="primaryColor" type="color" className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                <span className="text-sm text-surface-600 font-mono">Brand primary</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Accent Color</label>
              <div className="flex items-center gap-3 bg-surface-50 p-2 rounded-lg border border-surface-200">
                <input name="accentColor" type="color" className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                <span className="text-sm text-surface-600 font-mono">Brand accent</span>
              </div>
            </div>
          </div>
        </div>

        {state?.error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm border border-emerald-200">
            Branding updated successfully.
          </div>
        )}

        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={isPending} className="btn-primary flex items-center gap-2">
            <Palette className="w-4 h-4" />
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
