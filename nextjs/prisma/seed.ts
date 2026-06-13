import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Main user (looked up by LINE user ID so the seed is idempotent across DB resets)
  const user = await prisma.user.upsert({
    where: { lineUserId: "Ufd66dd59708cfa4fafd767a8495cb5fb" },
    update: {},
    create: {
      lineUserId: "Ufd66dd59708cfa4fafd767a8495cb5fb",
      name: "sakda.homhuan",
      image: "https://profile.line-scdn.net/0hjiX1GEA_NUZlSBrAnfNKEVkNOysSZjMOHS17dUFNa3RBfXNHDXkvKEgaa3IYK3MTDCgtKEZKaCJN",
    },
  });

  // Equipment items
  await prisma.equipmentItem.upsert({
    where: { id: "cmqbw8isf0004o65b4emr5q9t" },
    update: {},
    create: {
      id: "cmqbw8isf0004o65b4emr5q9t",
      userId: user.id,
      equipmentName: "test",
      model: "test",
      customerName: "test",
      location: "test",
      image: "/uploads/67190217-1fd7-4232-b33d-7ef4101481ca.webp",
    },
  });

  await prisma.equipmentItem.upsert({
    where: { id: "cmqbwtkgd0001o65b4nnys569" },
    update: {},
    create: {
      id: "cmqbwtkgd0001o65b4nnys569",
      userId: user.id,
      equipmentName: "XR-200",
      model: "XR-200",
      customerName: "Acme crop",
      location: "Floo3",
      image: "/uploads/08f9e00c-91ba-4f64-969d-dc8b246ae368.webp",
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
