import { SiteNav } from "@/components/SiteNav";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatHebrewDateShort } from "@/lib/date";
import { ShareClient } from "./share/ShareClient";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams
}: {
  searchParams: { token?: string };
}) {
  // Optional personalization — the page is public, the token only greets the
  // guest by name and attributes their uploads.
  let firstName: string | null = null;
  if (searchParams.token) {
    const g = await prisma.guest.findUnique({
      where: { rsvpToken: searchParams.token },
      select: { firstName: true }
    });
    if (g) firstName = g.firstName;
  }

  const [photos, settings] = await Promise.all([
    prisma.guestPhoto.findMany({ orderBy: { createdAt: "desc" } }),
    getSettings()
  ]);

  const coupleName = `${settings.brideName} ו${settings.groomName}`;
  const dateLabel = formatHebrewDateShort(new Date(settings.weddingDate));

  return (
    <>
      <SiteNav />
      <main
        style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "60px 18px 140px",
          background: "var(--paper)",
          minHeight: "100vh"
        }}
      >
        <ShareClient
          initialPhotos={photos.map((p) => ({
            id: p.id,
            url: p.url,
            type: p.type as "image" | "video",
            caption: p.caption,
            uploaderName: p.uploaderName
          }))}
          token={searchParams.token ?? null}
          guestFirstName={firstName}
          coupleName={coupleName}
          dateLabel={dateLabel}
        />
      </main>
    </>
  );
}
