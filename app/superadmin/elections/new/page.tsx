"use client";

import { useActionState } from "react";
import { createElection } from "@/app/actions/superadmin";
import Link from "next/link";
import { ArrowLeft, Building, Tag, AlignLeft, ShieldCheck } from "lucide-react";

export default function CreateElectionPage() {
  const [state, formAction, isPending] = useActionState(createElection, null);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <Link href="/superadmin" className="inline-flex items-center text-sm text-foreground/60 hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Overview
        </Link>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Building className="w-8 h-8 text-primary-500" />
          Provision New Election
        </h1>
        <p className="text-foreground/60 mt-1">Create a new isolated election instance on the CeVo platform.</p>
      </div>

      <div className="bg-card border border-white/10 rounded-2xl p-6 md:p-8">
        <form action={formAction} className="space-y-6">
          
          <div className="space-y-2">
            <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-foreground/90">
              <Building className="w-4 h-4 text-foreground/50" />
              Election Name
            </label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              required 
              placeholder="e.g. CESA 25/26 Executive Elections"
              className="input-field w-full text-left bg-black/20 focus:bg-black/40"
            />
            <p className="text-xs text-foreground/50">The formal display name of the election.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="slug" className="flex items-center gap-2 text-sm font-medium text-foreground/90">
              <Tag className="w-4 h-4 text-foreground/50" />
              URL Slug
            </label>
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-white/10 bg-white/5 text-foreground/50 text-sm h-[42px]">
                /e/
              </span>
              <input 
                type="text" 
                id="slug" 
                name="slug" 
                required 
                placeholder="cesa-2526"
                pattern="^[a-z0-9-]+$"
                title="Only lowercase letters, numbers, and hyphens are allowed."
                className="input-field w-full text-left rounded-l-none bg-black/20 focus:bg-black/40 h-[42px]"
              />
            </div>
            <p className="text-xs text-foreground/50">A unique, URL-safe identifier. Only lowercase letters, numbers, and hyphens.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="flex items-center gap-2 text-sm font-medium text-foreground/90">
              <AlignLeft className="w-4 h-4 text-foreground/50" />
              Description (Optional)
            </label>
            <textarea 
              id="description" 
              name="description" 
              rows={3}
              placeholder="Brief description shown to voters..."
              className="input-field w-full text-left bg-black/20 focus:bg-black/40 resize-none py-3"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/90">
              <ShieldCheck className="w-4 h-4 text-foreground/50" />
              Verification Method
            </label>
            <select 
              disabled 
              className="input-field w-full text-left bg-black/20 opacity-70 cursor-not-allowed appearance-none"
            >
              <option value="course_form">Course Registration Form (OCR)</option>
            </select>
            <p className="text-xs text-primary-400">More verification options coming in future updates.</p>
          </div>

          {state?.error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {state.error}
            </div>
          )}

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button 
              type="submit" 
              disabled={isPending}
              className="btn-primary py-2.5 px-6"
            >
              {isPending ? "Provisioning..." : "Create Election"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
