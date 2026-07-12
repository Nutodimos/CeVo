import { prisma } from "@/lib/prisma";

export async function logAudit(
  adminId: string, 
  action: string, 
  detail: any, 
  electionId: string | null = null,
  organisationId: string | null = null
) {
  await prisma.auditLog.create({
    data: {
      adminId,
      action,
      detail,
      electionId,
      organisationId,
    },
  });
}
