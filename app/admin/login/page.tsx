"use client";

import { useActionState, useState } from "react";
import { adminLogin, type AdminLoginResult } from "@/app/actions/admin";
import { Eye, EyeOff, Activity } from "lucide-react";

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState<AdminLoginResult | null, FormData>(
    adminLogin,
    null
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20 text-white">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-surface-900 mb-2">
            CeVo Platform
          </h1>
          <p className="text-surface-500 font-medium">
            Administrative Access Portal
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-surface-200 p-8 shadow-xl shadow-surface-200/50">
          <form action={formAction} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5" htmlFor="admin-email">
                Email Address
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                className="input-field w-full bg-surface-50 border-surface-200 focus:bg-white"
                placeholder="admin@organisation.edu"
                autoComplete="email"
                autoFocus
                required
                disabled={isPending}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5" htmlFor="admin-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="input-field w-full bg-surface-50 border-surface-200 focus:bg-white pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {state?.error && (
              <div className="animate-slide-down bg-red-50 border border-red-200 text-red-600 rounded-xl p-3.5 text-sm font-medium">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full py-3 mt-2 text-base shadow-lg shadow-primary-500/25"
              disabled={isPending}
            >
              {isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <span>Sign In Securely</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
