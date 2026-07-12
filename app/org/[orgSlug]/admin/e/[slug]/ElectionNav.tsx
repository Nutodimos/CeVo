"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, LayoutList, Settings, Eye, Flag, Menu, X, LogOut, ArrowLeft } from "lucide-react";
import { useState } from "react";

type ElectionNavProps = {
  orgSlug: string;
  slug: string;
  role: string;
  electionName: string;
  electionStatus: string;
  onLogoutAction: () => void;
};

export default function ElectionNav({ orgSlug, slug, role, electionName, electionStatus, onLogoutAction }: ElectionNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const basePath = `/org/${orgSlug}/admin/e/${slug}`;

  const getLinkClasses = (path: string) => {
    // If it's the exact home page, strictly match. Otherwise, just check if it starts with the path
    const isActive = path === basePath 
      ? pathname === path 
      : pathname.startsWith(path);
      
    return `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive 
        ? "bg-primary-50 text-primary-700" 
        : "text-surface-700 hover:bg-surface-100 hover:text-surface-900"
    }`;
  };

  const statusBadge = (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
      electionStatus === "setup" ? "bg-amber-100 text-amber-700" :
      electionStatus === "active" ? "bg-emerald-100 text-emerald-700" :
      "bg-surface-200 text-surface-700"
    }`}>
      {electionStatus}
    </span>
  );

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-surface-200 bg-white md:bg-transparent sticky top-0 z-10 md:static flex flex-col gap-3">
        <div className="flex justify-between items-center w-full">
          <Link href={`/org/${orgSlug}/admin`} className="text-xs font-medium text-surface-500 hover:text-surface-800 flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to Org
          </Link>
          <button className="md:hidden p-2 text-surface-600 hover:bg-surface-100 rounded-md -mr-2" onClick={() => setMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-hidden">
          <h1 className="font-bold text-lg truncate" title={electionName}>{electionName}</h1>
          <div className="flex items-center gap-2 mt-1">
            {statusBadge}
            <span className="text-xs text-surface-500 capitalize">{role}</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {role === "admin" && (
          <>
            <div className="text-xs font-semibold text-surface-400 mb-2 mt-2 px-3 uppercase tracking-wider">Setup</div>
            <Link href={basePath} onClick={() => setMobileMenuOpen(false)} className={getLinkClasses(basePath)}>
              <Home className="w-4 h-4" /> Home
            </Link>
            <Link href={`${basePath}/setup/voters`} onClick={() => setMobileMenuOpen(false)} className={getLinkClasses(`${basePath}/setup/voters`)}>
              <Users className="w-4 h-4" /> Voters
            </Link>
            <Link href={`${basePath}/setup/positions`} onClick={() => setMobileMenuOpen(false)} className={getLinkClasses(`${basePath}/setup/positions`)}>
              <LayoutList className="w-4 h-4" /> Positions
            </Link>
            <Link href={`${basePath}/setup/config`} onClick={() => setMobileMenuOpen(false)} className={getLinkClasses(`${basePath}/setup/config`)}>
              <Settings className="w-4 h-4" /> Configuration
            </Link>
            <Link href={`${basePath}/setup/preview`} onClick={() => setMobileMenuOpen(false)} className={getLinkClasses(`${basePath}/setup/preview`)}>
              <Eye className="w-4 h-4" /> Preview Ballot
            </Link>
          </>
        )}

        <div className="text-xs font-semibold text-surface-400 mb-2 mt-6 px-3 uppercase tracking-wider">Operations</div>
        <Link href={`${basePath}/review`} onClick={() => setMobileMenuOpen(false)} className={getLinkClasses(`${basePath}/review`)}>
          <Flag className="w-4 h-4" /> Review Queue
        </Link>
      </nav>

      <div className="p-4 border-t border-surface-200 mt-auto bg-white">
        <button onClick={onLogoutAction} className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-danger-500 hover:bg-danger-50 transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-surface-200 z-10 relative shadow-sm">
        <div className="flex flex-col overflow-hidden mr-4">
          <span className="font-bold text-surface-900 truncate">{electionName}</span>
          <div className="flex items-center gap-2 mt-0.5">
            {statusBadge}
          </div>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 -mr-2 text-surface-600 hover:bg-surface-100 rounded-md shrink-0"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar - Desktop and Mobile Drawer */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-surface-200 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        md:relative md:w-64 md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </aside>
    </>
  );
}
