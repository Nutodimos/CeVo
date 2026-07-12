import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import InviteForm from "./InviteForm";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params;
  const token = resolvedParams.token;
  
  const invite = await prisma.adminInvite.findUnique({
    where: { token },
  });

  if (!invite) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="glass-card max-w-md w-full p-8 text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Invalid Invite</h1>
          <p className="text-foreground/70">This invite link is invalid or does not exist.</p>
        </div>
      </main>
    );
  }

  if (invite.accepted) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="glass-card max-w-md w-full p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Invite Accepted</h1>
          <p className="text-foreground/70 mb-6">This invite has already been accepted.</p>
          <a href="/admin/login" className="btn-primary w-full text-center inline-block" style={{ textDecoration: 'none' }}>
            Go to Login
          </a>
        </div>
      </main>
    );
  }

  if (new Date() > invite.expiresAt) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="glass-card max-w-md w-full p-8 text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Invite Expired</h1>
          <p className="text-foreground/70 mb-6">This invite link has expired. Please request a new one from your administrator.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="glass-card max-w-md w-full p-8">
        <h1 className="text-2xl font-bold mb-2 text-center">Welcome to CeVo</h1>
        <p className="text-foreground/70 text-sm text-center mb-6">
          You've been invited to manage an election as a <strong>{invite.role}</strong>. 
          Please set up your profile to continue.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-6 flex justify-between items-center">
          <span className="text-sm text-foreground/60">Email</span>
          <span className="text-sm font-medium">{invite.email}</span>
        </div>

        <InviteForm token={token} />
      </div>
    </main>
  );
}
