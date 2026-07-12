import { prisma } from './lib/prisma';
async function run() {
  const election = await prisma.election.findUnique({
    where: { slug: 'test-25-26' },
  });
  console.log("Found Election:", election);
}
run();
