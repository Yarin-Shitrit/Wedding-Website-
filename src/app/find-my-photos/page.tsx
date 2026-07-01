import { SiteNav } from "@/components/SiteNav";
import { prisma } from "@/lib/prisma";
import { FindMyPhotosClient } from "./FindMyPhotosClient";

export const dynamic = "force-dynamic";

export default async function FindMyPhotosPage({
  searchParams
}: {
  searchParams: { token?: string };
}) {
  // Optional personalization — the page is public; the token only greets the
  // guest by name (mirrors the gallery homepage).
  let firstName: string | null = null;
  if (searchParams.token) {
    const g = await prisma.guest.findUnique({
      where: { rsvpToken: searchParams.token },
      select: { firstName: true }
    });
    if (g) firstName = g.firstName;
  }

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
        <FindMyPhotosClient guestFirstName={firstName} />
      </main>
    </>
  );
}
