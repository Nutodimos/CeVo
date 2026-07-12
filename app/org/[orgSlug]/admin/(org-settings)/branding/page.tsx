import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BrandingForm from "./BrandingForm";

export default async function OrgBrandingPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const resolvedParams = await params;
  const orgSlug = resolvedParams.orgSlug;
  
  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: {
      name: true,
      shortName: true,
      contactEmail: true,
      primaryColor: true,
      accentColor: true,
    }
  });

  if (!org) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Organisation Branding</h1>
        <p className="text-surface-600 mt-1">Manage how your organisation appears to voters.</p>
      </div>

      <BrandingForm orgSlug={orgSlug} defaultValues={org} />
    </div>
  );
}
