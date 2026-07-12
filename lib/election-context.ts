import { prisma } from "./prisma";

/**
 * Election context resolution module.
 * 
 * This is the SINGLE CHOKEPOINT through which every query gets its electionId.
 * No hardcoded election IDs anywhere in application code.
 */

export type ElectionRecord = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdBy: string;
  organisationId: string;
  organisation: {
    id: string;
    name: string;
    shortName: string;
    slug: string;
    logoUrl: string | null;
    primaryColor: string | null;
    accentColor: string | null;
    contactEmail: string | null;
    status: string;
  };
};

/**
 * Resolve an election by its URL slug.
 * Throws if the election does not exist.
 * Includes the organisation relation for branding.
 */
export async function getElectionBySlug(slug: string): Promise<ElectionRecord> {
  const election = await prisma.election.findUnique({
    where: { slug },
    include: { organisation: true },
  });

  if (!election) {
    throw new Error(`Election not found: "${slug}"`);
  }

  return election;
}

/**
 * Get the electionId for a given slug.
 * Convenience wrapper that returns just the ID string.
 * Throws if the election does not exist.
 */
export async function requireElectionId(slug: string): Promise<string> {
  const election = await getElectionBySlug(slug);
  return election.id;
}

/**
 * Get the default election (Phase A convenience).
 * Returns the first election found. Used for admin routes that
 * haven't been slug-scoped yet, or for the root redirect.
 */
export async function getDefaultElection(): Promise<ElectionRecord> {
  const election = await prisma.election.findFirst({
    orderBy: { createdAt: "asc" },
    include: { organisation: true },
  });

  if (!election) {
    throw new Error(
      "No elections exist. Please run the seed script to create a default election."
    );
  }

  return election;
}
