import { getDefaultElection } from "@/lib/election-context";
import { redirect } from "next/navigation";

/**
 * Root page — redirects to the default election landing page.
 * In Phase B, this could become an election picker.
 */
export default async function RootPage() {
  const election = await getDefaultElection();
  redirect(`/e/${election.slug}`);
}
