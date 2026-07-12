"use client";
import { toastConfirm } from '@/lib/toast-dialogs';
import toast from 'react-hot-toast';

import { useState } from "react";
import { Shield, ShieldAlert, Trash2 } from "lucide-react";
import { removeAdmin, changeAdminRole } from "@/app/actions/superadmin";
import InviteAdminModal from "./InviteAdminModal";
import { useRouter } from "next/navigation";

export default function AdminTeamTable({ electionId, admins }: { electionId: string, admins: any[] }) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleRemove = async (id: string, email: string) => {
    if (!(await toastConfirm(`Are you sure you want to remove ${email} from this election?`))) return;
    
    setIsPending(true);
    const res = await removeAdmin(id, electionId);
    if (res.success) {
      router.refresh();
    } else {
      toast.error(res.error || "Failed to remove admin.");
    }
    setIsPending(false);
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    setIsPending(true);
    const res = await changeAdminRole(id, electionId, newRole);
    if (res.success) {
      router.refresh();
    } else {
      toast.error(res.error || "Failed to change role.");
    }
    setIsPending(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-500" />
            Admin Team
          </h2>
          <p className="text-sm text-foreground/60">Manage the administrative staff assigned to run this election.</p>
        </div>
        <InviteAdminModal electionId={electionId} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-4 py-3 font-semibold text-foreground/80">User</th>
              <th className="px-4 py-3 font-semibold text-foreground/80">Role</th>
              <th className="px-4 py-3 font-semibold text-foreground/80">Added On</th>
              <th className="px-4 py-3 font-semibold text-foreground/80 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {admins.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-foreground/50">
                  No admins assigned to this election yet.
                </td>
              </tr>
            ) : (
              admins.map((relation) => (
                <tr key={relation.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{relation.admin.name}</div>
                    <div className="text-xs text-foreground/50">{relation.admin.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      relation.role === "admin" 
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}>
                      {relation.role === "admin" ? <ShieldAlert className="w-3 h-3 mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                      {relation.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground/60 text-xs">
                    {new Date(relation.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <select
                      disabled={isPending}
                      value={relation.role}
                      onChange={(e) => handleRoleChange(relation.id, e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-md text-xs px-2 py-1.5 focus:outline-none focus:border-primary-500/50"
                    >
                      <option value="admin">Admin</option>
                      <option value="reviewer">Reviewer</option>
                    </select>
                    <button
                      disabled={isPending}
                      onClick={() => handleRemove(relation.id, relation.admin.email)}
                      className="inline-flex items-center justify-center p-1.5 border border-red-500/30 bg-red-500/10 text-red-400 rounded-md hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      title="Remove Admin"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
