import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CreateElectionForm from "./CreateElectionForm";

export default async function NewElectionInOrgPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const resolvedParams = await params;
  const org = await prisma.organisation.findUnique({ where: { slug: resolvedParams.orgSlug } });
  if (!org) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Create Election</h1>
      <p className="text-foreground/60 mb-8">
        New election for <strong>{org.shortName}</strong> — {org.name}
      </p>

      <CreateElectionForm organisationId={org.id} orgSlug={org.slug} />
    </div>
  );
}
