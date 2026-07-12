import { prisma } from "./lib/prisma";

async function fix() {
  await prisma.adminUser.update({
    where: { email: "admin@cesa.edu" },
    data: { role: "reviewer" }
  });
  console.log("Fixed role to reviewer");
}

fix();
