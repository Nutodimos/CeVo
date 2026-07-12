import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";
import path from "path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";
import "dotenv/config";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  // Safety guard — never seed a production database
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Seed script refused to run in production. Set NODE_ENV=development to proceed."
    );
  }

  const csvPath = process.argv[2];

  if (!csvPath) {
    console.error("Usage: tsx prisma/seed.ts <path-to-csv>");
    console.error("Example: tsx prisma/seed.ts prisma/sample-voters.csv");
    process.exit(1);
  }

  const resolvedPath = path.resolve(csvPath);
  console.log(`📄 Reading CSV from: ${resolvedPath}`);

  const csvContent = readFileSync(resolvedPath, "utf-8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as { matricNumber: string; name: string; level?: string }[];

  // ==========================================
  // Seed default admin and superadmin
  // ==========================================
  console.log("\n👑 Seeding admin users...");

  // Read passwords from environment variables (set in .env for dev)
  const superAdminPassword = await bcrypt.hash(
    process.env.SEED_SUPERADMIN_PASSWORD || "DevSuperAdmin1!",
    10
  );
  const regularAdminPassword = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD || "DevAdmin123!",
    10
  );

  const superadmin = await prisma.adminUser.upsert({
    where: { email: "superadmin@cesa.edu" },
    update: { password: superAdminPassword },
    create: {
      email: "superadmin@cesa.edu",
      password: superAdminPassword,
      name: "CESA Super Admin",
      role: "super_admin",
    },
  });

  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@cesa.edu" },
    update: { password: regularAdminPassword, role: "reviewer" },
    create: {
      email: "admin@cesa.edu",
      password: regularAdminPassword,
      name: "CESA Admin",
      role: "reviewer",
    },
  });

  console.log("  ✅ Superadmin: superadmin@cesa.edu (password from SEED_SUPERADMIN_PASSWORD)");
  console.log("  ✅ Admin: admin@cesa.edu (password from SEED_ADMIN_PASSWORD)");

  // ==========================================
  // Seed CESA Organisation
  // ==========================================
  console.log("\n🏛️  Seeding CESA organisation...");

  const cesaOrg = await prisma.organisation.upsert({
    where: { slug: "cesa" },
    update: {},
    create: {
      name: "Computer Engineering Students' Association",
      shortName: "CESA",
      slug: "cesa",
      logoUrl: "/cesa-logo.jpg",
      primaryColor: "#F26522",
      accentColor: "#557C99",
      contactEmail: "cesa@unilorin.edu.ng",
      createdBy: superadmin.id,
    },
  });

  console.log(`  ✅ Organisation: ${cesaOrg.name} (${cesaOrg.slug})`);

  // Link superadmin as org_admin of CESA
  await prisma.orgMember.upsert({
    where: {
      organisationId_adminUserId: {
        organisationId: cesaOrg.id,
        adminUserId: superadmin.id,
      },
    },
    update: { role: "org_admin" },
    create: {
      organisationId: cesaOrg.id,
      adminUserId: superadmin.id,
      role: "org_admin",
    },
  });
  console.log("  ✅ Superadmin linked as CESA org_admin");

  // Link regular admin as org_admin of CESA too
  await prisma.orgMember.upsert({
    where: {
      organisationId_adminUserId: {
        organisationId: cesaOrg.id,
        adminUserId: admin.id,
      },
    },
    update: { role: "org_admin" },
    create: {
      organisationId: cesaOrg.id,
      adminUserId: admin.id,
      role: "org_admin",
    },
  });
  console.log("  ✅ Admin linked as CESA org_admin");

  // ==========================================
  // Seed Default Election (linked to CESA)
  // ==========================================
  console.log("\n🏢 Seeding default election...");
  const defaultElection = await prisma.election.upsert({
    where: { slug: "cesa-2526" },
    update: { organisationId: cesaOrg.id },
    create: {
      slug: "cesa-2526",
      name: "CESA Elections 2025/2026",
      organisationId: cesaOrg.id,
      createdBy: superadmin.id,
    },
  });
  const electionId = defaultElection.id;

  await prisma.electionAdmin.upsert({
    where: {
      electionId_adminUserId: {
        electionId,
        adminUserId: admin.id,
      },
    },
    update: { role: "admin" },
    create: {
      electionId,
      adminUserId: admin.id,
      role: "admin",
    },
  });

  console.log(`  ✅ Election: ${defaultElection.name} (${defaultElection.slug})`);

  // ==========================================
  // Seed Voters
  // ==========================================
  console.log(`\n👤 Found ${records.length} voter records`);

  let created = 0;
  let skipped = 0;

  for (const record of records) {
    try {
      await prisma.voterRoll.upsert({
        where: { electionId_matricNumber: { electionId, matricNumber: record.matricNumber } },
        update: { name: record.name, level: record.level || null },
        create: {
          electionId,
          matricNumber: record.matricNumber,
          name: record.name,
          level: record.level || null,
        },
      });
      created++;
    } catch (error) {
      console.error(`⚠️  Error processing ${record.matricNumber}:`, error);
      skipped++;
    }
  }

  console.log(`✅ Voters: ${created} upserted, ${skipped} skipped`);

  // ==========================================
  // Seed sample positions & candidates
  // ==========================================
  console.log("\n🗳️  Seeding positions & candidates...");

  const positions = [
    {
      title: "President",
      order: 1,
      candidates: [
        { name: "Adaeze Nnamdi", manifesto: "Committed to transparent governance and improved student welfare. Will establish a student emergency fund and monthly town halls." },
        { name: "Tunde Olawale", manifesto: "Innovation-driven leadership. Plans to digitize all departmental processes and create a student mentorship programme." },
        { name: "Fatima Ibrahim", manifesto: "Unity and progress. Focused on inter-departmental collaboration, academic excellence awards, and career development workshops." },
      ],
    },
    {
      title: "Vice President",
      order: 2,
      candidates: [
        { name: "Emeka Obi", manifesto: "Supporting the president with strategic planning and ensuring all class reps are empowered to serve effectively." },
        { name: "Aisha Mohammed", manifesto: "Bridging the gap between students and administration. Advocating for better lecture scheduling and facility maintenance." },
      ],
    },
    {
      title: "General Secretary",
      order: 3,
      candidates: [
        { name: "Oluwaseun Afolabi", manifesto: "Meticulous record-keeping and transparent communication. Will publish weekly bulletins and digitize all association documents." },
        { name: "Ngozi Emenike", manifesto: "Efficient administration and timely information dissemination through modern communication channels." },
      ],
    },
    {
      title: "Financial Secretary",
      order: 4,
      candidates: [
        { name: "Yusuf Bello", manifesto: "Accountability and fiscal responsibility. Will implement a transparent budgeting system with quarterly financial reports." },
        { name: "Precious Okoro", manifesto: "Smart financial management. Plans to establish a departmental savings scheme and sponsor academic competitions." },
      ],
    },
    {
      title: "Social Director",
      order: 5,
      candidates: [
        { name: "Kemi Adeyinka", manifesto: "Vibrant social calendar including tech fairs, game nights, and an annual departmental dinner. Making university memorable!" },
        { name: "Ibrahim Suleiman", manifesto: "Balanced social programming that combines fun with networking. Plans for industry mixers and skills workshops." },
        { name: "Chisom Nwachukwu", manifesto: "Creating an inclusive social environment. Sports tournaments, cultural celebrations, and community service projects." },
      ],
    },
  ];

  for (const pos of positions) {
    const position = await prisma.position.upsert({
      where: { id: `seed-${pos.title.toLowerCase().replace(/\s+/g, "-")}` },
      update: { order: pos.order },
      create: {
        id: `seed-${pos.title.toLowerCase().replace(/\s+/g, "-")}`,
        electionId,
        title: pos.title,
        order: pos.order,
      },
    });

    for (const cand of pos.candidates) {
      const candId = `seed-${cand.name.toLowerCase().replace(/\s+/g, "-")}`;
      await prisma.candidate.upsert({
        where: { id: candId },
        update: { name: cand.name, manifesto: cand.manifesto },
        create: { id: candId, name: cand.name, manifesto: cand.manifesto, positionId: position.id },
      });
    }

    console.log(`  ✅ ${pos.title}: ${pos.candidates.length} candidates`);
  }

  // ==========================================
  // Seed card templates (placeholder regions)
  // ==========================================
  console.log("\n📋 Seeding card templates...");

  const templateData = [
    { id: "tpl-old-print", name: "old_print", matricRegion: { x: 10, y: 60, width: 40, height: 15 }, active: false },
    { id: "tpl-new-print", name: "new_print", matricRegion: { x: 15, y: 55, width: 35, height: 8 }, active: false },
    { id: "tpl-temp-laminated", name: "temp_laminated", matricRegion: { x: 5, y: 50, width: 45, height: 18 }, active: false },
    { id: "tpl-course-form", name: "course_form", matricRegion: { x: 20, y: 10, width: 60, height: 20 }, active: true },
  ];

  for (const tpl of templateData) {
    await prisma.cardTemplate.upsert({
      where: { id: tpl.id },
      update: {},
      create: { id: tpl.id, name: tpl.name, matricRegion: tpl.matricRegion, active: false },
    });
    console.log(`  ✅ Template: ${tpl.name} initialized (if not existed)`);
  }

  // ==========================================
  // Seed initial Election Config
  // ==========================================
  console.log("\n⚙️  Seeding Election Config...");
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const configs = await prisma.electionConfig.findMany({ where: { electionId } });
  if (configs.length === 0) {
    await prisma.electionConfig.create({
      data: { electionId, opensAt: yesterday, closesAt: tomorrow, resultsPublished: false },
    });
    console.log("  ✅ Election Config: Open from yesterday until tomorrow");
  } else {
    console.log("  ✅ Election Config already exists, skipping.");
  }

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
