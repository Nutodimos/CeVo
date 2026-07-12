"use client";
import toast from 'react-hot-toast';

import { useState } from "react";
import { forceCloseElection, uncertifyElection, revertElectionToSetup } from "@/app/actions/superadmin";
import { AlertTriangle, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ElectionTransitions({ electionId, electionName, status }: { electionId: string, electionName: string, status: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [actionType, setActionType] = useState<"force_close" | "uncertify" | "revert_to_setup" | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  if (status !== "active" && status !== "certified" && status !== "closed") return null;

  const handleOpen = (type: "force_close" | "uncertify" | "revert_to_setup") => {
    setActionType(type);
    setIsOpen(true);
    setConfirmText("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText !== electionName || !actionType) return;
    
    setIsPending(true);
    const res = actionType === "force_close" 
      ? await forceCloseElection(electionId)
      : actionType === "uncertify" 
        ? await uncertifyElection(electionId)
        : await revertElectionToSetup(electionId);
      
    if (res.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      toast.error(res.error || "Action failed.");
    }
    setIsPending(false);
  };

  return (
    <>
      <div className="flex gap-3">
        {status === "active" && (
          <button onClick={() => handleOpen("force_close")} className="btn-danger py-1.5 px-3 text-xs">
            Force Close
          </button>
        )}
        {status === "certified" && (
          <button onClick={() => handleOpen("uncertify")} className="btn-danger py-1.5 px-3 text-xs">
            Uncertify
          </button>
        )}
        {status === "closed" && (
          <button onClick={() => handleOpen("revert_to_setup")} className="btn-danger py-1.5 px-3 text-xs">
            Revert to Setup
          </button>
        )}
      </div>

      {isOpen && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-red-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-red-500/5">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-5 h-5" />
                {actionType === "force_close" ? "Force Close Election" : actionType === "uncertify" ? "Uncertify Election" : "Revert to Setup"}
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-foreground/50 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <p className="text-sm text-foreground/80">
                This is a destructive action intended for emergency platform operations. 
                {actionType === "force_close" 
                  ? " This will immediately close the election, preventing any further voting, even if the scheduled close time hasn't passed." 
                  : actionType === "uncertify" 
                    ? " This will remove the certification status of the election, reverting it to a closed state."
                    : " This will change a closed election back to 'setup', unpublishing any results. It will NOT delete cast votes."}
              </p>

              <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Please type <strong>{electionName}</strong> to confirm.
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  required
                  className="input-field w-full text-left bg-black/40"
                  placeholder={electionName}
                />
              </div>

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
                  disabled={isPending || confirmText !== electionName}
                  className="btn-danger py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? "Processing..." : "Confirm Action"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
