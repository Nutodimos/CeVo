"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Building2, CheckCircle, Clock, Menu, X } from "lucide-react";
import { adminLogout } from "@/app/actions/admin";

type SidebarProps = {
  adminEmail: string;
  orgCount: number;
  activeElectionsCount: number;
  totalPendingReviews: number;
};

export default function SuperAdminSidebar({ adminEmail, orgCount, activeElectionsCount, totalPendingReviews }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const getLinkClass = (path: string, exact: boolean = false) => {
    const isActive = exact ? pathname === path : pathname.startsWith(path);
    return `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive ? "bg-primary-500/20 text-primary-400" : "hover:bg-white/5 text-foreground/80 hover:text-foreground"
    }`;
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-white/10 sticky top-0 z-20">
        <Link href="/superadmin" className="text-lg font-bold tracking-tight flex items-center gap-2 text-primary-500">
          <Activity className="w-5 h-5" />
          CeVo Platform
        </Link>
        <button onClick={() => setIsOpen(true)} className="p-2 -mr-2 text-foreground/60 hover:text-foreground">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={closeMenu} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-card border-r border-white/10 flex flex-col transition-transform duration-300
        md:relative md:translate-x-0 md:w-64
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 pb-0 mb-8 flex justify-between items-start">
          <div>
            <Link href="/superadmin" onClick={closeMenu} className="text-xl font-bold tracking-tight flex items-center gap-2 text-primary-500">
              <Activity className="w-6 h-6" />
              CeVo Platform
            </Link>
            <p className="text-xs text-foreground/50 mt-1 uppercase tracking-wider font-semibold">Super Admin</p>
          </div>
          <button onClick={closeMenu} className="md:hidden p-1 text-foreground/60 hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 flex-1 px-6 overflow-y-auto">
          <div>
            <h3 className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-3">Platform Health</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
                <div className="flex items-center gap-2 text-primary-500">
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Organisations</span>
                </div>
                <span className="font-mono font-bold text-primary-500">{orgCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-500">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Active Elections</span>
                </div>
                <span className="font-mono font-bold text-emerald-500">{activeElectionsCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2 text-yellow-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Pending Reviews</span>
                </div>
                <span className="font-mono font-bold text-yellow-500">{totalPendingReviews}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-3">Navigation</h3>
            <nav className="space-y-1">
              <Link href="/superadmin" onClick={closeMenu} className={getLinkClass("/superadmin", true)}>
                Organisations
              </Link>
              <Link href="/superadmin/orgs/new" onClick={closeMenu} className={getLinkClass("/superadmin/orgs/new")}>
                Create Organisation
              </Link>
              <Link href="/elections" target="_blank" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-white/5 text-foreground/80 hover:text-foreground transition-colors">
                Public Archive ↗
              </Link>
            </nav>
          </div>
        </div>

        <div className="p-6 pt-4 border-t border-white/10 mt-auto bg-card">
          <div className="text-sm text-foreground/70 mb-2 truncate" title={adminEmail}>
            {adminEmail}
          </div>
          <form action={adminLogout}>
            <button type="submit" className="text-xs text-red-400 hover:text-red-300 font-medium">
              Sign Out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
