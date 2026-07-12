"use client";

import { useActionState, useRef } from "react";
import { changePassword } from "@/app/actions/admin";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // If successful, we can show a toast and clear the form
  if (state?.success && formRef.current) {
    toast.success("Password changed successfully!");
    formRef.current.reset();
    state.success = false; // Reset state so it doesn't trigger repeatedly
  }

  return (
    <form ref={formRef} action={formAction} className="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm space-y-6 mt-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-surface-900 border-b border-surface-100 pb-2">Change Password</h3>
        
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Current Password</label>
          <div className="relative">
            <input 
              name="currentPassword" 
              type={showCurrent ? "text" : "password"} 
              required 
              className="input-field w-full pr-10" 
              placeholder="Enter current password" 
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 focus:outline-none"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">New Password</label>
          <div className="relative">
            <input 
              name="newPassword" 
              type={showNew ? "text" : "password"} 
              required 
              className="input-field w-full pr-10" 
              placeholder="Enter new password" 
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 focus:outline-none"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-surface-500 mt-2">
            Must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Confirm New Password</label>
          <div className="relative">
            <input 
              name="confirmPassword" 
              type={showConfirm ? "text" : "password"} 
              required 
              className="input-field w-full pr-10" 
              placeholder="Confirm new password" 
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 focus:outline-none"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {state?.error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
          {state.error}
        </div>
      )}

      <div className="pt-4 flex justify-end">
        <button type="submit" disabled={isPending} className="btn-primary flex items-center gap-2">
          <Lock className="w-4 h-4" />
          {isPending ? "Changing..." : "Change Password"}
        </button>
      </div>
    </form>
  );
}
