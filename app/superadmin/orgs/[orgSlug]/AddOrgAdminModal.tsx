"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { inviteOrgAdmin } from "@/app/actions/superadmin";

export default function AddOrgAdminModal({ orgId, orgSlug }: { orgId: string, orgSlug: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => {
    if (loading) return;
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name")?.toString();
    const email = formData.get("email")?.toString();
    const role = formData.get("role")?.toString();

    if (!email || !role) {
      toast.error("Email and role are required");
      setLoading(false);
      return;
    }

    const result = await inviteOrgAdmin(orgId, email, role, name);

    if (result.success) {
      toast.success(result.message || "Admin added successfully");
      setIsOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to add admin");
    }
    setLoading(false);
  };

  return (
    <>
      <button 
        onClick={handleOpen}
        className="inline-flex items-center justify-center px-3 py-1.5 border border-primary-500/30 bg-primary-500/10 text-primary-400 rounded-md text-xs font-medium hover:bg-primary-500/20 transition-colors ml-4"
      >
        <Plus className="w-3 h-3 mr-1" /> Add Member
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-scale-in">
            <button 
              onClick={handleClose}
              disabled={loading}
              className="absolute right-4 top-4 text-foreground/50 hover:text-foreground disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold mb-6">Add Organization Member</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name (Optional)</label>
                <input 
                  type="text" 
                  name="name" 
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary-500"
                  placeholder="Jane Doe"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email <span className="text-red-500">*</span></label>
                <input 
                  type="email" 
                  name="email" 
                  required
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary-500"
                  placeholder="jane@example.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role <span className="text-red-500">*</span></label>
                <select 
                  name="role" 
                  required
                  defaultValue="org_admin"
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary-500"
                  disabled={loading}
                >
                  <option value="org_admin">Org Admin (Full Access)</option>
                  <option value="reviewer">Reviewer (Read Only)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 py-2 px-4 rounded-lg border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 py-2 px-4 rounded-lg bg-primary-600 hover:bg-primary-500 text-white transition-colors flex justify-center items-center disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
