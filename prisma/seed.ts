import { PrismaClient, Side, RsvpStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      brideName: "Amit",
      groomName: "Ben",
      weddingDate: new Date("2026-09-04T19:00:00+03:00"),
      venueName: "The Garden",
      venueAddress: "123 Main St, Tel Aviv",
      venueMapUrl: "https://maps.google.com/?q=Tel+Aviv",
      parkingInfo:
        "Free parking is available on-site starting 18:00. Valet service provided at the main entrance.",
      dressCode: "Cocktail / Elegant",
      welcomeMessage: "We can't wait to celebrate with you!"
    }
  });

  const tableA = await prisma.table.upsert({
    where: { name: "Table 1" },
    update: {},
    create: { name: "Table 1", capacity: 10, notes: "Family — bride side" }
  });
  const tableB = await prisma.table.upsert({
    where: { name: "Table 2" },
    update: {},
    create: { name: "Table 2", capacity: 10, notes: "Family — groom side" }
  });

  await prisma.guest.upsert({
    where: { rsvpToken: "demo-alice" },
    update: {},
    create: {
      firstName: "Alice",
      lastName: "Cohen",
      phone: "+972500000001",
      side: Side.BRIDE,
      group: "Family",
      seatsInvited: 2,
      seatsConfirmed: 2,
      status: RsvpStatus.ATTENDING,
      rsvpToken: "demo-alice",
      tableId: tableA.id
    }
  });

  await prisma.guest.upsert({
    where: { rsvpToken: "demo-bob" },
    update: {},
    create: {
      firstName: "Bob",
      lastName: "Levi",
      phone: "+972500000002",
      side: Side.GROOM,
      group: "Friends",
      seatsInvited: 1,
      status: RsvpStatus.PENDING,
      rsvpToken: "demo-bob",
      tableId: tableB.id
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
