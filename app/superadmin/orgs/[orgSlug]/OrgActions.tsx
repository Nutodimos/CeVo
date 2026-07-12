"use client";
import { toastConfirm, toastPrompt } from '@/lib/toast-dialogs';
import toast from 'react-hot-toast';
import { useState } from "react";
import { suspendOrganisation, reactivateOrganisation, deleteOrganisation } from "@/app/actions/superadmin";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle, Trash2 } from "lucide-react";

export default function OrgActions({ orgId, orgSlug, status, orgName }: { orgId: string; orgSlug: string; status: string; orgName: string }) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    if (!(await toastConfirm(status === "active"
      ? "Suspend this organisation? All their voter-facing pages will show as unavailable."
      : "Reactivate this organisation?"))) return;

    setIsPending(true);
    const res = status === "active"
      ? await suspendOrganisation(orgId)
      : await reactivateOrganisation(orgId);

    if (res.success) {
      router.refresh();
      toast.success(status === "active" ? "Organisation suspended" : "Organisation reactivated");
    } else {
      toast.error(res.error || "Action failed");
    }
    setIsPending(false);
  };

  const handleDelete = async () => {
    const confirmName = await toastPrompt(`DANGER: This will permanently delete the entire organisation, including all its elections, voters, and results.\n\nType "${orgSlug}" to confirm:`);
    if (confirmName !== orgSlug) {
      if (confirmName !== null) toast.error("Slug did not match. Deletion cancelled.");
      return;
    }

    setIsPending(true);
    const res = await deleteOrganisation(orgId);

    if (res.success) {
      toast.success("Organisation deleted successfully");
      router.push('/superadmin');
    } else {
      toast.error(res.error || "Failed to delete organisation");
      setIsPending(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${status === "active"
            ? "border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
            : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
          }`}
      >
        {isPending ? "..." : status === "active" ? <><Ban className="w-3 h-3" /> Suspend</> : <><CheckCircle className="w-3 h-3" /> Reactivate</>}
      </button>

      <button
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20"
      >
        <Trash2 className="w-3 h-3" /> Delete
      </button>
    </div>
  );
}
