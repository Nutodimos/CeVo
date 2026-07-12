"use client";

import { useActionState, useState } from "react";
import { createOrganisation } from "@/app/actions/superadmin";
import { Building2, Upload, X, Eye, EyeOff } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";

export default function NewOrgPage() {
  const [state, formAction, isPending] = useActionState(createOrganisation, null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Create Organisation</h1>
      <p className="text-foreground/60 mb-8">Set up a new department or association on the CeVo platform.</p>

      <form action={formAction} className="bg-card border border-white/10 rounded-xl p-6 space-y-6">
        <input type="hidden" name="logoUrl" value={logoUrl || ""} />
        
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-3">Organisation Logo</label>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="Logo" className="w-20 h-20 object-contain rounded-lg border border-white/10 bg-white/5" />
                <button 
                  type="button" 
                  onClick={() => setLogoUrl(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <CldUploadWidget 
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"} 
                onSuccess={(result: any) => setLogoUrl(result.info.secure_url)}
              >
                {({ open }) => (
                  <button 
                    type="button" 
                    onClick={() => open()}
                    className="flex flex-col items-center justify-center w-20 h-20 rounded-lg border-2 border-dashed border-white/20 hover:border-primary-500/50 hover:bg-primary-500/5 transition-colors text-foreground/60 hover:text-primary-400"
                  >
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium uppercase tracking-wider">Upload</span>
                  </button>
                )}
              </CldUploadWidget>
            )}
            <div className="text-xs text-foreground/50">
              <p>Upload a transparent PNG (recommended).</p>
              <p>Will be displayed on voter pages and dashboards.</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1">Organisation Name *</label>
          <input name="name" type="text" required className="input-field" placeholder="e.g. Computer Engineering Students' Association" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Short Name *</label>
            <input name="shortName" type="text" required className="input-field" placeholder="e.g. CESA" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">URL Slug *</label>
            <input name="slug" type="text" required className="input-field" placeholder="e.g. cesa" pattern="^[a-z0-9-]+$" />
            <p className="text-xs text-foreground/50 mt-1">Lowercase letters, numbers, hyphens only</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1">Contact Email</label>
          <input name="contactEmail" type="email" className="input-field" placeholder="e.g. cesa@unilorin.edu.ng" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Primary Color</label>
            <div className="flex items-center gap-2">
              <input name="primaryColor" type="color" defaultValue="#F26522" className="w-10 h-10 rounded cursor-pointer border-0" />
              <span className="text-sm text-foreground/50">Brand primary</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Accent Color</label>
            <div className="flex items-center gap-2">
              <input name="accentColor" type="color" defaultValue="#557C99" className="w-10 h-10 rounded cursor-pointer border-0" />
              <span className="text-sm text-foreground/50">Brand accent</span>
            </div>
          </div>
        </div>

        <hr className="border-white/10" />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Organization Administrator</h2>
          <p className="text-sm text-foreground/60">Create the first admin account for this organization.</p>
          
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Admin Name *</label>
            <input name="adminName" type="text" required className="input-field" placeholder="e.g. John Doe" />
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Admin Email *</label>
              <input name="adminEmail" type="email" required className="input-field" placeholder="e.g. admin@cesa.com" />
              <p className="text-xs text-foreground/50 mt-1">An invitation link will be sent to this email to set up their password.</p>
            </div>
          </div>
        </div>

        {state?.error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm">
            {state.error}
          </div>
        )}

        <button type="submit" disabled={isPending} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
          <Building2 className="w-4 h-4" />
          {isPending ? "Creating..." : "Create Organisation"}
        </button>
      </form>
    </div>
  );
}
