"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutList, Palette, Users, LogOut, Menu, X, UserCircle } from "lucide-react";
import { adminLogout } from "@/app/actions/admin";

type SidebarProps = {
  adminEmail: string;
  adminName?: string;
  adminAvatarUrl?: string | null;
  orgSlug: string;
  orgShortName: string;
  orgLogoUrl: string | null;
  orgPrimaryColor: string | null;
};

export default function OrgAdminSidebar({ adminEmail, adminName, adminAvatarUrl, orgSlug, orgShortName, orgLogoUrl, orgPrimaryColor }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const getLinkClass = (path: string, exact: boolean = false) => {
    const isActive = exact ? pathname === path : pathname.startsWith(path);
    return `flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive ? "bg-primary-50 text-primary-700" : "text-surface-700 hover:bg-surface-100"
    }`;
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-surface-200 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          {orgLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={orgLogoUrl} alt={orgShortName} className="w-8 h-8 object-contain rounded" />
          ) : (
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: orgPrimaryColor || "#F26522" }}>
              <Building2 className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="font-bold text-surface-900">{orgShortName} Admin</span>
        </div>
        <button onClick={() => setIsOpen(true)} className="p-2 -mr-2 text-surface-600 hover:bg-surface-100 rounded-md">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={closeMenu} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-surface-200 flex flex-col shadow-xl transition-transform duration-300
        md:relative md:translate-x-0 md:w-64 md:shadow-sm
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 pb-4 flex justify-between items-start">
          <div className="flex items-center gap-3">
            {orgLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={orgLogoUrl} alt={orgShortName} className="w-10 h-10 object-contain rounded-lg" />
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: orgPrimaryColor || "#F26522" }}>
                <Building2 className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <div className="text-lg font-bold text-surface-900">{orgShortName}</div>
              <div className="text-xs text-surface-500">Org Admin</div>
            </div>
          </div>
          <button onClick={closeMenu} className="md:hidden p-1 text-surface-500 hover:bg-surface-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-1 flex-1 px-4 overflow-y-auto mt-4">
          <Link href={`/org/${orgSlug}/admin`} onClick={closeMenu} className={getLinkClass(`/org/${orgSlug}/admin`, true)}>
            <LayoutList className="w-4 h-4" /> Elections
          </Link>
          <Link href={`/org/${orgSlug}/admin/branding`} onClick={closeMenu} className={getLinkClass(`/org/${orgSlug}/admin/branding`)}>
            <Palette className="w-4 h-4" /> Branding
          </Link>
          <Link href={`/org/${orgSlug}/admin/members`} onClick={closeMenu} className={getLinkClass(`/org/${orgSlug}/admin/members`)}>
            <Users className="w-4 h-4" /> Members
          </Link>
          <Link href={`/org/${orgSlug}/admin/profile`} onClick={closeMenu} className={getLinkClass(`/org/${orgSlug}/admin/profile`)}>
            <UserCircle className="w-4 h-4" /> My Profile
          </Link>
        </nav>

        <div className="p-6 border-t border-surface-200 mt-auto bg-white">
          <div className="flex items-center gap-3 mb-4">
            {adminAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={adminAvatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-surface-200" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center text-surface-500 font-medium">
                {adminName ? adminName.charAt(0) : adminEmail.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-surface-900 truncate" title={adminName}>{adminName || "Admin"}</div>
              <div className="text-xs text-surface-500 truncate" title={adminEmail}>
                {adminEmail}
              </div>
            </div>
          </div>
          <form action={adminLogout}>
            <button type="submit" className="text-xs text-red-500 hover:text-red-400 font-medium flex items-center gap-1 w-full p-2 hover:bg-red-50 rounded transition-colors">
              <LogOut className="w-3 h-3" /> Sign Out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
