"use client";
import toast from 'react-hot-toast';

import { useState } from "react";
import { PendingVote } from "@prisma/client";
import { CheckCircle, XCircle, AlertTriangle, AlertCircle, X, ChevronDown, ChevronUp } from "lucide-react";
import { approveVote, rejectVote } from "@/app/actions/review";
import { useRouter } from "next/navigation";

type ExtendedPendingVote = PendingVote & {
  voterRoll?: { name: string } | null;
};

export default function ReviewQueueClient({
  initialVotes,
  electionSlug,
}: {
  initialVotes: ExtendedPendingVote[];
  electionSlug: string;
}) {
  const router = useRouter();
  const [selectedVote, setSelectedVote] = useState<ExtendedPendingVote | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // Status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_review":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Review Needed
          </span>
        );
      case "flagged_invalid":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
            <AlertCircle className="w-3 h-3 mr-1" />
            Flagged Invalid
          </span>
        );
      default:
        return null;
    }
  };

  const handleAction = async (action: "approve" | "reject", id: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      const res = action === "approve" ? await approveVote(id, electionSlug) : await rejectVote(id, electionSlug);
      if (res.success) {
        setSelectedVote(null);
        setShowRaw(false);
        router.refresh(); // Refresh data from server
      } else {
        toast.error("Action failed: " + res.error);
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="bg-card rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 font-medium">Matric Number</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {initialVotes.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-foreground/50">
                  Queue is empty! 🎉
                </td>
              </tr>
            ) : (
              initialVotes.map((vote) => (
                <tr 
                  key={vote.id} 
                  className="hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => setSelectedVote(vote)}
                >
                  <td className="px-6 py-4 font-mono font-medium">{vote.matricNumber}</td>
                  <td className="px-6 py-4">{getStatusBadge(vote.status)}</td>
                  <td className="px-6 py-4 text-foreground/60">
                    {new Date(vote.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {selectedVote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-background border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold">
                Review Course Form: <span className="font-mono text-primary">{selectedVote.matricNumber}</span>
              </h2>
              <button 
                onClick={() => {
                  setSelectedVote(null);
                  setShowRaw(false);
                }}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                disabled={isProcessing}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex flex-col md:flex-row flex-1 overflow-y-auto">
              
              {/* Left: Full Image */}
              <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-white/10 bg-black/40 flex flex-col">
                <h3 className="text-sm font-medium text-foreground/60 mb-4 uppercase tracking-wider">Full Captured Course Form</h3>
                <div className="relative flex-1 bg-black rounded-lg overflow-hidden border border-white/10 min-h-[300px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={selectedVote.cardPhotoUrl} 
                    alt="Course Form" 
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Right: Data & Actions */}
              <div className="w-full md:w-1/2 p-6 flex flex-col space-y-6">
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground/60 uppercase tracking-wider">Gemini Verification</h3>
                  
                  {!selectedVote.geminiDocValid && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      <p className="text-sm text-red-400">
                        Gemini did not recognize this as an official course registration form.
                      </p>
                    </div>
                  )}

                  {selectedVote.reviewNote && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-yellow-500/70 font-medium uppercase mb-1">System Flag Reason</p>
                        <p className="text-sm text-yellow-400">
                          {selectedVote.reviewNote}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                      <p className="text-xs text-foreground/50 mb-1">Matric (Entered)</p>
                      <p className="font-mono text-lg font-bold">{selectedVote.matricNumber}</p>
                    </div>
                    
                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                      <p className="text-xs text-foreground/50 mb-1">Matric (Extracted)</p>
                      <p className={`font-mono text-lg font-bold ${
                        selectedVote.geminiExtracted === selectedVote.matricNumber 
                          ? "text-emerald-400" 
                          : "text-amber-400"
                      }`}>
                        {selectedVote.geminiExtracted || "NOT_FOUND"}
                      </p>
                    </div>

                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                      <p className="text-xs text-foreground/50 mb-1">Name (Roll)</p>
                      <p className="font-mono text-sm font-bold leading-tight">
                        {selectedVote.voterRoll?.name || "Not Found in Roll"}
                      </p>
                    </div>

                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                      <p className="text-xs text-foreground/50 mb-1">Name (Extracted)</p>
                      <p className={`font-mono text-sm font-bold leading-tight ${
                        selectedVote.geminiName ? "text-amber-400" : "text-foreground/50"
                      }`}>
                        {selectedVote.geminiName || "NOT_FOUND"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg border border-white/5 overflow-hidden">
                    <button 
                      onClick={() => setShowRaw(!showRaw)}
                      className="w-full flex items-center justify-between p-4 text-sm font-medium text-foreground/70 hover:bg-white/5 transition-colors"
                    >
                      <span>Raw Gemini Response</span>
                      {showRaw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showRaw && (
                      <div className="p-4 pt-0 border-t border-white/10 bg-black/20">
                        <pre className="font-mono text-xs whitespace-pre-wrap text-foreground/60">
                          {selectedVote.geminiRaw || "No raw response available"}
                        </pre>
                      </div>
                    )}
                  </div>
                  
                </div>

                <div className="mt-auto pt-6 flex gap-4">
                  <button
                    onClick={() => handleAction("reject", selectedVote.id)}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Form
                  </button>
                  <button
                    onClick={() => handleAction("approve", selectedVote.id)}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve Form
                  </button>
                </div>
                <p className="text-xs text-center text-foreground/40 mt-2">
                  Approval verifies the vote. Rejection flags for voter retry.
                </p>

              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
