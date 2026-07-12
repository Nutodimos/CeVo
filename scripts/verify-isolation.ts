import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function verifyIsolation() {
  console.log("🔥 Warming up database connection...");
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    console.log("Warmup failed, trying again...", e);
  }

  console.log("🔍 Running Isolation Audit...");

  // 0. Get an organisation
  const org = await prisma.organisation.findFirst();
  if (!org) {
    console.error("❌ No organisation found.");
    process.exit(1);
  }

  // 1. Create a dummy election
  const dummy = await prisma.election.create({
    data: {
      slug: "dummy-election",
      name: "Dummy Election",
      createdBy: "admin@cesa.edu",
      organisationId: org.id,
    },
  });
  console.log(`✅ Created dummy election: ${dummy.id}`);

  // 2. Fetch voters for the dummy election
  const dummyVoters = await prisma.voterRoll.findMany({
    where: { electionId: dummy.id },
  });
  
  if (dummyVoters.length > 0) {
    console.error("❌ ISOLATION FAILURE: Dummy election sees voters from other elections!");
    process.exit(1);
  } else {
    console.log("✅ Isolation verified: Dummy election has 0 voters.");
  }

  // 3. Cleanup dummy election
  await prisma.election.delete({
    where: { id: dummy.id },
  });
  console.log("✅ Cleanup complete.");
}

verifyIsolation()
  .catch((e) => {
    console.error("❌ Audit failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
