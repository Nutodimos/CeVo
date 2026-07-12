import { prisma } from "../lib/prisma";

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log("Connection successful!", result);
  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
