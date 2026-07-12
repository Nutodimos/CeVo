import { prisma } from "./prisma";

export type ElectionStatusResult = {
  status: string;
  isActive: boolean;
  isOpen: boolean;
  isClosed: boolean;
  opensAt?: Date;
  closesAt?: Date;
  resultsPublished: boolean;
};

export async function getElectionStatus(electionId: string): Promise<ElectionStatusResult> {
  const election = await prisma.election.findUnique({
    where: { id: electionId },
    include: { config: true },
  });

  if (!election || !election.config) {
    return {
      status: election?.status || "setup",
      isActive: false,
      isOpen: false,
      isClosed: election?.status === "closed" || election?.status === "certified",
      resultsPublished: false,
    };
  }

  const { config, status } = election;
  const now = new Date();
  
  // An election is open if its status is active AND it is within the time window
  const isTimeWindowOpen = now >= config.opensAt && now <= config.closesAt;
  const isOpen = status === "active" && isTimeWindowOpen;
  
  // It is considered closed if its status is explicitly "closed" or "certified"
  // OR if it's active but the time has expired.
  const isTimeExpired = now > config.closesAt;
  const isClosed = status === "closed" || status === "certified" || (status === "active" && isTimeExpired);

  return {
    status,
    isActive: status === "active",
    isOpen,
    isClosed,
    opensAt: config.opensAt,
    closesAt: config.closesAt,
    resultsPublished: config.resultsPublished,
  };
}
