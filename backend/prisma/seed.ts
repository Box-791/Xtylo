import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean slate (safe in dev)
  await prisma.outreachLog.deleteMany();
  await prisma.outreachMessage.deleteMany();
  await prisma.student.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.school.deleteMany();

  const school1 = await prisma.school.create({
    data: {
      name: "Lincoln High School",
      city: "Phoenix",
      state: "AZ",
    },
  });

  const school2 = await prisma.school.create({
    data: {
      name: "Roosevelt High School",
      city: "Phoenix",
      state: "AZ",
    },
  });

  const campaign = await prisma.campaign.create({
    data: {
      name: "Spring 2026 Beauty Recruitment",
      startDate: new Date("2026-01-01"),
    },
  });

  await prisma.student.createMany({
    data: [
      {
        firstName: "Emily",
        lastName: "Garcia",
        email: "emily@example.com",
        phone: "6025551111",
        schoolId: school1.id,
        campaignId: campaign.id,
      },
      {
        firstName: "Sofia",
        lastName: "Martinez",
        email: "sofia@example.com",
        phone: "6025552222",
        schoolId: school2.id,
        campaignId: campaign.id,
      },
    ],
  });

  console.log("🌱 Seed data inserted");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
