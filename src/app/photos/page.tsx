import { SiteNav } from "@/components/SiteNav";
import { prisma } from "@/lib/prisma";
import { issueEventToken } from "@/lib/snapfinder";
import { PhotosClient } from "./PhotosClient";

export const dynamic = "force-dynamic";

export default async function PhotosPage({
  searchParams
}: {
  searchParams: { token?: string };
}) {
  const apiBase = process.env.NEXT_PUBLIC_SNAPFINDER_API_URL;
  const eventId = process.env.SNAPFINDER_EVENT_ID;
  const ttl = Number(process.env.SNAPFINDER_EVENT_TOKEN_TTL ?? 3600);

  // Friendly gate: missing token, missing guest, or missing config all land
  // on the same Hebrew "use your personal link" screen — no hard 404.
  let guest: { firstName: string } | null = null;
  if (searchParams.token) {
    const g = await prisma.guest.findUnique({
      where: { rsvpToken: searchParams.token },
      select: { firstName: true }
    });
    if (g) guest = { firstName: g.firstName };
  }

  const configured = Boolean(apiBase && eventId);
  if (!guest || !configured) {
    return (
      <>
        <SiteNav />
        <main
          style={{
            maxWidth: 480,
            margin: "0 auto",
            padding: "80px 24px 120px",
            background: "var(--paper)",
            minHeight: "100vh",
            textAlign: "center"
          }}
        >
          <div className="eyebrow">גלריית האירוע</div>
          <h1
            className="display"
            style={{ fontSize: 32, margin: "12px 0 8px" }}
          >
            התמונות שלך
          </h1>
          <div className="ornament">· · ·</div>
          <p
            style={{
              marginTop: 18,
              fontSize: 15,
              lineHeight: 1.8,
              color: "var(--ink-2)"
            }}
          >
            כדי לצפות בתמונות שלך מהאירוע, יש להיכנס דרך הקישור האישי
            שנשלח אליך בהזמנה. הקישור כולל קוד שמזהה אותך באופן בטוח.
          </p>
          <p
            style={{
              marginTop: 14,
              fontSize: 13,
              lineHeight: 1.7,
              color: "var(--ink-3)"
            }}
          >
            לא מוצאים את ההזמנה? פנו אלינו ונשלח לכם את הקישור מחדש.
          </p>
        </main>
      </>
    );
  }

  const eventToken = await issueEventToken(eventId!, ttl);

  return (
    <>
      <SiteNav />
      <main
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "60px 18px 140px",
          background: "var(--paper)",
          minHeight: "100vh"
        }}
      >
        <PhotosClient
          apiBase={apiBase!}
          eventToken={eventToken}
          guestFirstName={guest.firstName}
        />
      </main>
    </>
  );
}
