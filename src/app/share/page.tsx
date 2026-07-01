import { SiteNav } from "@/components/SiteNav";
import { prisma } from "@/lib/prisma";
import { ShareClient } from "./ShareClient";

export const dynamic = "force-dynamic";

export default async function SharePage({
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

  const photos = await prisma.guestPhoto.findMany({
    orderBy: { createdAt: "desc" }
  });

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
            caption: p.caption,
            uploaderName: p.uploaderName
          }))}
          token={searchParams.token ?? null}
          guestFirstName={firstName}
        />
      </main>
    </>
  );
}
