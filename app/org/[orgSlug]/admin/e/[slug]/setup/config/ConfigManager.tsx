"use client";
import { toastConfirm } from '@/lib/toast-dialogs';
import toast from 'react-hot-toast';

import { useState } from "react";
import { updateElectionConfig } from "@/app/actions/setup";
import { useRouter } from "next/navigation";

export default function ConfigManager({
  electionId,
  initialConfig,
  initialDescription,
  isLocked
}: {
  electionId: string;
  initialConfig: any;
  initialDescription: string;
  isLocked: boolean;
}) {
  const [description, setDescription] = useState(initialDescription || "");
  
  // Format dates for datetime-local input (YYYY-MM-DDThh:mm)
  const formatForInput = (d?: Date) => {
    if (!d) return "";
    const date = new Date(d);
    // adjust for local timezone offset
    const tzOffset = date.getTimezoneOffset() * 60000; 
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  const [opensAt, setOpensAt] = useState(initialConfig?.opensAt ? formatForInput(initialConfig.opensAt) : "");
  const [closesAt, setClosesAt] = useState(initialConfig?.closesAt ? formatForInput(initialConfig.closesAt) : "");
  const [resultsVisibility, setResultsVisibility] = useState(initialConfig?.resultsVisibility || "manual");
  const [adminContact, setAdminContact] = useState(initialConfig?.adminContact || "");
  
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    
    if (!opensAt || !closesAt) {
      toast("Please set both open and close times.");
      return;
    }
    
    const openDate = new Date(opensAt);
    const closeDate = new Date(closesAt);
    
    if (closeDate <= openDate) {
      toast("Closing time must be after opening time.");
      return;
    }
    
    const diffHours = (closeDate.getTime() - openDate.getTime()) / (1000 * 60 * 60);
    if (diffHours < 1) {
      if (!(await toastConfirm("The election window is less than 1 hour. Are you sure?"))) {
        return;
      }
    }

    if (!(await toastConfirm(`Save configuration?\nVoting opens: ${openDate.toLocaleString()}\nVoting closes: ${closeDate.toLocaleString()}`))) {
      return;
    }

    setIsPending(true);
    const res = await updateElectionConfig(electionId, {
      description,
      opensAt: openDate,
      closesAt: closeDate,
      resultsVisibility,
      adminContact: adminContact.trim()
    });
    
    if (res.success) {
      router.refresh();
      toast.success("Configuration saved successfully.");
    } else {
      toast.error(res.error || "Failed to save configuration");
    }
    setIsPending(false);
  };

  return (
    <form onSubmit={handleSave} className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
      <div className="p-6 space-y-6">
        
        <div>
          <label className="block text-sm font-semibold text-surface-900 mb-1">Voting Window</label>
          <p className="text-sm text-surface-500 mb-4">When can voters access the ballot and cast their votes?</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Opens At</label>
              <input 
                type="datetime-local" 
                value={opensAt}
                onChange={(e) => setOpensAt(e.target.value)}
                required
                disabled={isLocked}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Closes At</label>
              <input 
                type="datetime-local" 
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                required
                disabled={isLocked}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <hr className="border-surface-100" />

        <div>
          <label className="block text-sm font-semibold text-surface-900 mb-1">Election Description</label>
          <p className="text-sm text-surface-500 mb-2">Shown to voters on the landing page before they begin voting.</p>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLocked}
            className="input-field min-h-[120px]"
            placeholder="Welcome to the elections. Please have your ID ready..."
          />
        </div>

        <hr className="border-surface-100" />

        <div>
          <label className="block text-sm font-semibold text-surface-900 mb-1">Admin Contact for Support</label>
          <p className="text-sm text-surface-500 mb-2">Provide a phone number, email, or WhatsApp link (e.g., wa.me/1234567890) for students who cannot find their registration during the eligibility check.</p>
          <input 
            type="text"
            value={adminContact}
            onChange={(e) => setAdminContact(e.target.value)}
            disabled={isLocked}
            className="input-field"
            placeholder="e.g. wa.me/1234567890 or support@example.com"
          />
        </div>

        <hr className="border-surface-100" />

        <div>
          <label className="block text-sm font-semibold text-surface-900 mb-1">Results Visibility</label>
          <p className="text-sm text-surface-500 mb-4">When should voters be able to see the results?</p>
          
          <div className="space-y-3">
            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
              resultsVisibility === "manual" ? "border-primary-500 bg-primary-50" : "border-surface-200 hover:border-primary-300"
            }`}>
              <input 
                type="radio" 
                name="resultsVisibility" 
                value="manual"
                checked={resultsVisibility === "manual"}
                onChange={() => setResultsVisibility("manual")}
                disabled={isLocked}
                className="mt-1 accent-primary-500"
              />
              <div>
                <div className="font-medium text-surface-900">Manual Publish Only (Recommended)</div>
                <div className="text-sm text-surface-500">Results remain hidden until an admin manually publishes them from the dashboard.</div>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
              resultsVisibility === "auto" ? "border-primary-500 bg-primary-50" : "border-surface-200 hover:border-primary-300"
            }`}>
              <input 
                type="radio" 
                name="resultsVisibility" 
                value="auto"
                checked={resultsVisibility === "auto"}
                onChange={() => setResultsVisibility("auto")}
                disabled={isLocked}
                className="mt-1 accent-primary-500"
              />
              <div>
                <div className="font-medium text-surface-900">Auto-publish on Close</div>
                <div className="text-sm text-surface-500">Results are automatically published to voters the exact moment the voting window closes.</div>
              </div>
            </label>
          </div>
        </div>

      </div>
      
      <div className="p-4 bg-surface-50 border-t border-surface-200 flex justify-end">
        <button 
          type="submit" 
          disabled={isLocked || isPending} 
          className="btn-primary py-2 px-6"
        >
          {isPending ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </form>
  );
}
