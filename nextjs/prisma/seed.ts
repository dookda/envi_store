import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.equipmentItem.upsert({
    where:  { id: "sample001" },
    update: {},
    create: {
      id:            "sample001",
      equipmentName: "Air Quality Monitor",
      model:         "AQM-100",
      customerName:  "Acme Corp",
      location:      "Building A, Floor 3",
    },
  });

  await prisma.equipmentItem.upsert({
    where:  { id: "sample002" },
    update: {},
    create: {
      id:            "sample002",
      equipmentName: "XR-200",
      model:         "XR-200",
      customerName:  "Acme Corp",
      location:      "Floor 3",
      inUse:         true,
      installedAt:   new Date("2026-06-01"),
      expiredAt:     new Date("2026-12-31"),
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
