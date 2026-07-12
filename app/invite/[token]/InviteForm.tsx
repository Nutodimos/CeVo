"use client";

import { useActionState } from "react";
import { acceptInvite } from "@/app/actions/superadmin";

export default function InviteForm({ token, defaultName }: { token: string, defaultName?: string | null }) {
  const [state, formAction, isPending] = useActionState(acceptInvite, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium text-foreground/80">Full Name</label>
        <input 
          type="text" 
          id="name" 
          name="name" 
          required 
          placeholder="e.g. Jane Doe"
          defaultValue={defaultName || ""}
          className="input-field w-full text-left bg-black/20 focus:bg-black/40"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium text-foreground/80">Password</label>
        <input 
          type="password" 
          id="password" 
          name="password" 
          required 
          placeholder="••••••••"
          className="input-field w-full text-left bg-black/20 focus:bg-black/40"
        />
        <ul className="text-xs text-foreground/50 mt-2 space-y-1 pl-4 list-disc">
          <li>At least 8 characters</li>
          <li>One uppercase letter</li>
          <li>One lowercase letter</li>
          <li>One number</li>
          <li>One special character (@$!%*?&)</li>
        </ul>
      </div>

      {state?.error && (
        <div className="p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md">
          {state.error}
        </div>
      )}

      {state?.success ? (
        <div className="text-center p-4">
          <p className="text-emerald-500 font-medium mb-4">Account created successfully!</p>
          <a href="/admin/login" className="btn-primary w-full text-center inline-block" style={{ textDecoration: 'none' }}>
            Go to Login
          </a>
        </div>
      ) : (
        <button 
          type="submit" 
          disabled={isPending}
          className="btn-primary w-full py-2.5 mt-2"
        >
          {isPending ? "Creating Account..." : "Accept Invite & Create Account"}
        </button>
      )}
    </form>
  );
}
