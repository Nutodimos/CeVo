"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/app/actions/admin";
import { KeyRound, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    null
  );

  return (
    <main className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in-up">
        <Link 
          href="/admin/login" 
          className="inline-flex items-center text-sm font-medium text-surface-500 hover:text-surface-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to login
        </Link>
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20 text-white">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-surface-900 mb-2">
            Reset Password
          </h1>
          <p className="text-surface-500 font-medium">
            Enter your email to receive a reset link
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-surface-200 p-8 shadow-xl shadow-surface-200/50">
          {state?.success ? (
            <div className="text-center animate-fade-in">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-surface-900 mb-2">Check your email</h3>
              <p className="text-surface-500 text-sm mb-6">{state.message}</p>
              <Link href="/admin/login" className="btn-primary w-full justify-center inline-flex">
                Return to Login
              </Link>
            </div>
          ) : (
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
                    <span>Sending...</span>
                  </div>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
