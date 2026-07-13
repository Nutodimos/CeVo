"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { removeOrgAdmin } from "@/app/actions/superadmin";

export default function RemoveOrgAdminButton({ orgId, adminUserId }: { orgId: string, adminUserId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRemove = async () => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    
    setLoading(true);
    const result = await removeOrgAdmin(orgId, adminUserId);

    if (result.success) {
      toast.success("Member removed successfully");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to remove member");
    }
    setLoading(false);
  };

  return (
    <button 
      onClick={handleRemove}
      disabled={loading}
      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50"
      title="Remove member"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  );
}
