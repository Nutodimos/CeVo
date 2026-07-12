"use client";
import { toastConfirm } from '@/lib/toast-dialogs';
import toast from 'react-hot-toast';

import { useState } from "react";
import { runTallyJob } from "@/app/actions/tally";
import { runCleanupJob } from "@/app/actions/cleanup";
import { publishResults } from "@/app/actions/election";
import { Database, Trash2, Megaphone } from "lucide-react";

export default function JobRunners({ 
  electionSlug,
  isClosed, 
  resultsPublished 
}: { 
  electionSlug: string,
  isClosed: boolean, 
  resultsPublished: boolean 
}) {
  const [isTallying, setIsTallying] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleTally = async () => {
    if (!(await toastConfirm("Are you sure you want to run the anonymization and tally job now?"))) return;
    
    setIsTallying(true);
    try {
      const res = await runTallyJob(electionSlug);
      if (res.success) {
        toast.success(`Tally Job Complete!\nProcessed: ${res.processed} votes\nSkipped: ${res.skipped}`);
      } else {
        toast.error("Tally Job failed.");
      }
    } catch (err: unknown) {
      toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsTallying(false);
    }
  };

  const handleCleanup = async () => {
    if (!(await toastConfirm("Are you sure you want to run the retention cleanup job? This will permanently delete archived photos older than 24 hours."))) return;
    
    setIsCleaning(true);
    try {
      const res = await runCleanupJob(electionSlug);
      if (res.success) {
        toast.error(`Cleanup Job Complete!\nDeleted: ${res.processed} old records\nFailed: ${res.failed}`);
      } else {
        toast.error("Cleanup Job failed.");
      }
    } catch (err: unknown) {
      toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsCleaning(false);
    }
  };

  const handlePublish = async () => {
    if (!(await toastConfirm("Are you sure you want to publish the results? This will make them visible to all students."))) return;
    
    setIsPublishing(true);
    try {
      const res = await publishResults(electionSlug);
      if (res.success) {
        toast.success("Results have been published successfully!");
      }
    } catch (err: unknown) {
      toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-6">
      <div className="glass-card p-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-500" />
            Run Tally Job
          </h3>
          <p className="text-sm text-foreground/60">
            Anonymize verified votes, write them to the ballot box, and archive the identity stub for 24 hours.
          </p>
        </div>
        <button
          onClick={handleTally}
          disabled={isTallying || isCleaning || isPublishing}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          {isTallying ? (
            <><div className="spinner w-4 h-4 border-2" /> Processing...</>
          ) : (
            "Run Tally"
          )}
        </button>
      </div>

      <div className="glass-card p-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2 text-red-500">
            <Trash2 className="w-5 h-5" />
            Run Retention Cleanup
          </h3>
          <p className="text-sm text-foreground/60">
            Permanently delete identity stubs and ID card photos that are older than the 24-hour retention window.
          </p>
        </div>
        <button
          onClick={handleCleanup}
          disabled={isTallying || isCleaning || isPublishing}
          className="btn-secondary text-red-500 hover:bg-red-50 border-red-200 flex items-center gap-2 whitespace-nowrap"
        >
          {isCleaning ? (
            <><div className="spinner w-4 h-4 border-2 !border-t-red-500" /> Cleaning...</>
          ) : (
            "Run Cleanup"
          )}
        </button>
      </div>

      <div className="glass-card p-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2 text-amber-500">
            <Megaphone className="w-5 h-5" />
            Publish Results
          </h3>
          <p className="text-sm text-foreground/60">
            {isClosed 
              ? (resultsPublished ? "Results are already public." : "Unlock the public results page for all students to see.")
              : "Election must be closed before results can be published."}
          </p>
        </div>
        <button
          onClick={handlePublish}
          disabled={!isClosed || resultsPublished || isTallying || isCleaning || isPublishing}
          className="btn-secondary border-amber-200 text-amber-600 hover:bg-amber-50 flex items-center gap-2 whitespace-nowrap"
        >
          {isPublishing ? (
            <><div className="spinner w-4 h-4 border-2 !border-t-amber-500" /> Publishing...</>
          ) : (
            resultsPublished ? "Published" : "Publish Results"
          )}
        </button>
      </div>
    </div>
  );
}
