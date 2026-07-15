import { ReactNode } from "react";
import { getElectionBySlug } from "@/lib/election-context";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const election = await getElectionBySlug(resolvedParams.slug);
    
    return {
      title: election.name,
      description: `Official voting portal for ${election.name}`,
    };
  } catch (e) {
    return {
      title: "Election Not Found",
    };
  }
}

export default async function ElectionVoterLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  try {
    const election = await getElectionBySlug(slug);
    const org = election.organisation;

    // We can inject CSS variables that override Tailwind's primary and accent colors
    // We would need to set up Tailwind to accept CSS variables, but for now we'll 
    // inject them inline if possible, or we could just set custom properties.
    const customStyles = {
      ...(org.primaryColor ? { "--color-primary-500": org.primaryColor } : {}),
      ...(org.accentColor ? { "--color-primary-600": org.accentColor } : {}),
    } as React.CSSProperties;

    return (
      <div style={customStyles} className="election-brand-wrapper min-h-screen">
        {children}
      </div>
    );
  } catch (error) {
    notFound();
  }
}
