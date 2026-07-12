import { prisma } from "./lib/prisma";

async function main() {
  const templates = await prisma.cardTemplate.findMany();
  console.log(JSON.stringify(templates, null, 2));
}

main().finally(() => prisma.$disconnect());
