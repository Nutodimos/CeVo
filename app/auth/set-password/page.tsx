import { validatePasswordSetupToken } from "@/lib/passwordSetupToken";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";
import SetPasswordForm from "./SetPasswordForm";

export default async function SetPasswordPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ token?: string }> 
}) {
  const resolvedParams = await searchParams;
  const token = resolvedParams.token;

  if (!token) {
    return <InvalidTokenState message="No token provided." />;
  }

  const tokenRecord = await validatePasswordSetupToken(token);

  if (!tokenRecord) {
    return <InvalidTokenState message="This link is invalid, has expired, or has already been used." />;
  }

  return (
    <main className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-surface-900 mb-2">
            Secure Your Account
          </h1>
          <p className="text-surface-500 font-medium">
            Welcome, {tokenRecord.user.name}. Please set your password to continue.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-surface-200 p-8 shadow-xl shadow-surface-200/50">
          <SetPasswordForm token={token} />
        </div>
      </div>
    </main>
  );
}

function InvalidTokenState({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center animate-fade-in-up">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20 text-white">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-surface-900 mb-3">
          Invalid Link
        </h1>
        <p className="text-surface-500 mb-8">{message}</p>
        <Link href="/admin/forgot-password" className="btn-primary inline-flex justify-center px-6">
          Request a new link
        </Link>
      </div>
    </main>
  );
}
