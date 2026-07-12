"use client";

import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { inviteAdmin } from "@/app/actions/superadmin";

export default function InviteAdminModal({ electionId }: { electionId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError("");
    setMessage("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email")?.toString();
    const name = formData.get("name")?.toString();
    const role = formData.get("role")?.toString();

    if (!email || !role) {
      setError("Please provide an email and role.");
      setIsPending(false);
      return;
    }

    const res = await inviteAdmin(electionId, email, role, name);

    if (res.success) {
      setMessage(res.message || "Invite sent.");
      // We don't auto-close so the admin can read the message (especially since it prints to console for now)
    } else {
      setError(res.error || "Failed to invite admin.");
    }
    setIsPending(false);
  };

  return (
    <>
      <button 
        onClick={() => { setIsOpen(true); setMessage(""); setError(""); }}
        className="btn-primary py-1.5 px-3 text-sm inline-flex items-center gap-1.5"
      >
        <UserPlus className="w-4 h-4" />
        Invite Admin
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary-500" />
                Invite Admin
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-foreground/50 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <p className="text-sm text-foreground/70 mb-4">
                Enter the details of the person you want to invite. If they don't have an account, they will be sent an onboarding link.
              </p>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground/80 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="input-field w-full text-left"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground/80 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="input-field w-full text-left"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-foreground/80 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  className="input-field w-full text-left"
                  defaultValue="reviewer"
                >
                  <option value="reviewer">Reviewer (Can process forms)</option>
                  <option value="admin">Admin (Can manage election settings)</option>
                </select>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md">
                  {error}
                </div>
              )}

              {message && (
                <div className="p-3 text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-md">
                  {message}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground"
                >
                  {message ? "Close" : "Cancel"}
                </button>
                {!message && (
                  <button
                    type="submit"
                    disabled={isPending}
                    className="btn-primary py-2 text-sm"
                  >
                    {isPending ? "Sending..." : "Send Invite"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
