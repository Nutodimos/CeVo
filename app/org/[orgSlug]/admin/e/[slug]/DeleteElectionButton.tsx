"use client";
import { toastPrompt } from '@/lib/toast-dialogs';
import toast from 'react-hot-toast';

import { useState } from "react";
import { deleteElection } from "@/app/actions/superadmin";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteElectionButton({ electionId, orgSlug }: { electionId: string, orgSlug: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const confirmName = (await toastPrompt('DANGER: This will permanently delete this election and all associated votes, candidates, and positions. This action CANNOT be undone.\n\nType "DELETE" to confirm:'));
    if (confirmName !== "DELETE") return;

    setIsDeleting(true);
    const res = await deleteElection(electionId);
    
    if (res.success) {
      toast.success("Election deleted successfully.");
      router.push(`/org/${orgSlug}/admin`);
    } else {
      toast.error(res.error || "Failed to delete election");
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="btn-secondary py-2 text-sm border-danger-200 text-danger-600 hover:bg-danger-50 flex items-center gap-2"
    >
      <Trash2 className="w-4 h-4" />
      {isDeleting ? "Deleting..." : "Delete Election"}
    </button>
  );
}
