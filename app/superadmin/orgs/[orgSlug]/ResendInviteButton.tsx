"use client";

import { useTransition, useState } from "react";
import { resendOrgAdminInvite } from "@/app/actions/superadmin";
import { Mail } from "lucide-react";

export default function ResendInviteButton({ adminUserId, orgSlug }: { adminUserId: string; orgSlug: string }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = () => {
    startTransition(async () => {
      setError(null);
      setSuccess(false);
      const result = await resendOrgAdminInvite(adminUserId, orgSlug);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "Failed to resend invite");
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleResend}
        disabled={isPending || success}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-foreground/80 hover:text-foreground"
      >
        <Mail className="w-3.5 h-3.5" />
        {isPending ? "Sending..." : success ? "Sent!" : "Resend Invite"}
      </button>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
}
