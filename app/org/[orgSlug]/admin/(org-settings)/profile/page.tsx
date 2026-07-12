import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin-auth";
import { notFound, redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function AdminProfilePage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const resolvedParams = await params;
  const orgSlug = resolvedParams.orgSlug;
  const session = await verifyAdminSession();
  
  if (!session) {
    redirect("/admin/login");
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: session.adminId },
    select: {
      name: true,
      email: true,
      avatarUrl: true,
    }
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">My Profile</h1>
        <p className="text-surface-600 mt-1">Manage your personal settings and profile photo.</p>
      </div>

      <ProfileForm 
        defaultName={user.name} 
        email={user.email} 
        defaultAvatar={user.avatarUrl} 
      />

      <ChangePasswordForm />
    </div>
  );
}

