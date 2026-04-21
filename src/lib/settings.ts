import { prisma } from "./prisma";

export async function getSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;
  return prisma.settings.create({
    data: {
      id: "singleton",
      brideName: process.env.NEXT_PUBLIC_BRIDE_NAME ?? "Amit",
      groomName: process.env.NEXT_PUBLIC_GROOM_NAME ?? "Ben",
      weddingDate: new Date(
        process.env.NEXT_PUBLIC_WEDDING_DATE ?? "2026-09-04T19:00:00+03:00"
      ),
      venueName: process.env.NEXT_PUBLIC_VENUE_NAME ?? "The Garden",
      venueAddress: process.env.NEXT_PUBLIC_VENUE_ADDRESS ?? "",
      venueMapUrl: process.env.NEXT_PUBLIC_VENUE_MAP_URL ?? ""
    }
  });
}
