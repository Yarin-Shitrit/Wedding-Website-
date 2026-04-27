import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";

const prisma = new PrismaClient();

async function main() {
  // Use $queryRaw — schema doesn't match types, so we bypass them.
  const guests = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, "firstName", "lastName", phone, side, relation,
            "invitedCount", "rsvpStatus", "attendingCount",
            dietary, notes, "tableId", "createdAt", "updatedAt"
     FROM "Guest"`
  );
  const tables = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, label, capacity, x, y FROM "Table"`
  );
  const photos = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, "dataUrl", caption, "sortOrder", "createdAt" FROM "Photo"`
  );
  const stations = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, title, description, "dataUrl", "sortOrder", "createdAt" FROM "Station"`
  );

  console.log(
    `Dumped: guests=${guests.length} tables=${tables.length} photos=${photos.length} stations=${stations.length}`
  );

  writeFileSync(
    "/tmp/migration-snapshot.json",
    JSON.stringify({ guests, tables, photos, stations }, null, 2),
    "utf-8"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
