import { prisma } from "./prisma";

export async function getSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;
  return prisma.settings.create({
    data: {
      id: "singleton",
      brideName: process.env.NEXT_PUBLIC_BRIDE_NAME ?? "אילי",
      groomName: process.env.NEXT_PUBLIC_GROOM_NAME ?? "ירין",
      weddingDate: new Date(
        process.env.NEXT_PUBLIC_WEDDING_DATE ?? "2026-10-15T19:00:00+03:00"
      ),
      venueName: process.env.NEXT_PUBLIC_VENUE_NAME ?? "אולמי השדרה",
      venueAddress: process.env.NEXT_PUBLIC_VENUE_ADDRESS ?? "דרך השדרות 12, רעננה",
      venueMapUrl: process.env.NEXT_PUBLIC_VENUE_MAP_URL ?? ""
    }
  });
}
