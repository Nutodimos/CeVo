import { getDefaultElection } from "@/lib/election-context";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/admin-auth";

export default async function AdminRootPage() {
  const admin = await verifyAdminSession();
  if (!admin) redirect("/admin/login");

  const election = await getDefaultElection();
  redirect(`/org/${election.organisation.slug}/admin/e/${election.slug}`);
}
