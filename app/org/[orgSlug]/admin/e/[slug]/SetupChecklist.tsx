"use client";
import { toastConfirm } from '@/lib/toast-dialogs';
import toast from 'react-hot-toast';

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { goLive } from "@/app/actions/setup";

type ChecklistItem = {
  id: string;
  label: string;
  completed: boolean;
  href: string;
  icon: React.ReactNode;
};

export default function SetupChecklist({ electionId, checklist }: { electionId: string, checklist: ChecklistItem[] }) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const allCompleted = checklist.every(item => item.completed);

  const handleGoLive = async () => {
    if (!(await toastConfirm("Once live, voters can begin voting. Are you sure you want to go live now?"))) return;
    
    setIsPending(true);
    const res = await goLive(electionId);
    if (res.success) {
      router.refresh();
    } else {
      toast.error(res.error || "Failed to go live");
      setIsPending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-surface-100 bg-surface-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-surface-900">Setup Progress</h2>
            <p className="text-sm text-surface-500">
              {checklist.filter(i => i.completed).length} of {checklist.length} steps completed
            </p>
          </div>
          <div className="relative">
            <button
              onClick={handleGoLive}
              disabled={!allCompleted || isPending}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              title={!allCompleted ? "Complete all setup steps first" : "Launch the election"}
            >
              {isPending ? "Starting..." : "Go Live"}
            </button>
            {!allCompleted && (
              <div className="absolute right-0 top-full mt-2 w-48 text-xs bg-surface-800 text-white p-2 rounded shadow-lg text-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                Complete all checklist items to launch the election.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="divide-y divide-surface-100">
        {checklist.map((item) => (
          <Link 
            key={item.id}
            href={item.href}
            className="flex items-center justify-between p-4 hover:bg-surface-50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                item.completed 
                  ? "bg-emerald-500 border-emerald-500 text-white" 
                  : "bg-surface-50 border-surface-200 text-surface-400 group-hover:border-primary-300 group-hover:text-primary-500"
              }`}>
                {item.completed ? <Check className="w-5 h-5" /> : item.icon}
              </div>
              <span className={`font-medium ${item.completed ? "text-surface-900" : "text-surface-600 group-hover:text-surface-900"}`}>
                {item.label}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-surface-300 group-hover:text-surface-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
