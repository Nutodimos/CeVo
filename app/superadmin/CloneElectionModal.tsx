"use client";

import { useState } from "react";
import { Copy, X } from "lucide-react";
import { cloneElection } from "@/app/actions/superadmin";
import { useRouter } from "next/navigation";

export default function CloneElectionModal({ electionId, electionName }: { electionId: string, electionName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleClone = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const newName = formData.get("newName")?.toString();

    if (!newName) {
      setError("Please provide a new election name.");
      setIsPending(false);
      return;
    }

    const res = await cloneElection(electionId, newName);

    if (res.success && res.slug) {
      setIsOpen(false);
      router.push(`/superadmin/elections/${res.slug}`);
    } else {
      setError(res.error || "Failed to clone election.");
      setIsPending(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center px-3 py-1.5 border border-white/10 bg-white/5 text-foreground/80 rounded-md text-xs font-medium hover:bg-white/10 transition-colors"
      >
        <Copy className="w-3 h-3 mr-1" />
        Clone
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Copy className="w-5 h-5 text-primary-500" />
                Clone Election
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-foreground/50 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleClone} className="p-6 space-y-4">
              <p className="text-sm text-foreground/70 mb-4">
                This will create a new election in "setup" status. It will copy the positions and candidates from <strong className="text-foreground">{electionName}</strong>. It will <strong>not</strong> copy voters, votes, or admin team members.
              </p>

              <div>
                <label htmlFor="newName" className="block text-sm font-medium text-foreground/80 mb-1">
                  New Election Name
                </label>
                <input
                  type="text"
                  id="newName"
                  name="newName"
                  required
                  defaultValue={`${electionName} (Copy)`}
                  className="input-field w-full text-left"
                  placeholder="e.g. CESA 26/27 Executive Elections"
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md">
                  {error}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary py-2 text-sm"
                >
                  {isPending ? "Cloning..." : "Clone Election"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
