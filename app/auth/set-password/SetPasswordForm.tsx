"use client";

import { useActionState, useState } from "react";
import { setPassword } from "@/app/actions/admin";
import { Eye, EyeOff } from "lucide-react";

export default function SetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(setPassword, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      
      <div>
        <label className="block text-sm font-semibold text-surface-700 mb-1.5" htmlFor="new-password">
          New Password
        </label>
        <div className="relative">
          <input
            id="new-password"
            name="password"
            type={showPassword ? "text" : "password"}
            className="input-field w-full bg-surface-50 border-surface-200 focus:bg-white pr-10"
            placeholder="••••••••"
            required
            disabled={isPending}
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 p-1"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <p className="text-xs text-surface-500 mt-2">
          Must be at least 8 characters, and contain an uppercase letter, a lowercase letter, a number, and a special character.
        </p>
      </div>

      {state?.error && (
        <div className="animate-slide-down bg-red-50 border border-red-200 text-red-600 rounded-xl p-3.5 text-sm font-medium">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="animate-slide-down bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl p-3.5 text-sm font-medium">
          Password set successfully! Redirecting...
        </div>
      )}

      <button
        type="submit"
        className="btn-primary w-full py-3 mt-2 text-base shadow-lg shadow-primary-500/25"
        disabled={isPending || state?.success}
      >
        {isPending || state?.success ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <span>{state?.success ? "Redirecting..." : "Saving..."}</span>
          </div>
        ) : (
          <span>Save Password & Continue</span>
        )}
      </button>
    </form>
  );
}
