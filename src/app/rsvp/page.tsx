import { SiteNav } from "@/components/SiteNav";
import { RsvpForm } from "./RsvpForm";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const HE_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const HE_MONTHS = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר"
];

function formatHebrewDate(d: Date) {
  const day = HE_DAYS[d.getDay()];
  const month = HE_MONTHS[d.getMonth()];
  return `יום ${day} · ${d.getDate()} ב${month} ${d.getFullYear()}`;
}

export default async function RsvpPage({
  searchParams
}: {
  searchParams: { token?: string; phone?: string };
}) {
  const settings = await getSettings();

  let initialGuest = null;
  if (searchParams.token) {
    const g = await prisma.guest.findUnique({
      where: { rsvpToken: searchParams.token }
    });
    if (g) {
      initialGuest = {
        id: g.id,
        token: g.rsvpToken,
        firstName: g.firstName,
        lastName: g.lastName,
        name: [g.firstName, g.lastName].filter(Boolean).join(" "),
        phone: g.phone,
        seatsInvited: g.seatsInvited,
        seatsConfirmed: g.seatsConfirmed,
        status: g.status as "PENDING" | "ATTENDING" | "DECLINED" | "MAYBE",
        dietary: g.dietary,
        notes: g.notes,
        respondedAt: g.respondedAt ? g.respondedAt.toISOString() : null
      };
    }
  }

  const dateLabel = formatHebrewDate(new Date(settings.weddingDate));

  return (
    <>
      <SiteNav />
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 6px" }}>
        <RsvpForm
          initialGuest={initialGuest}
          rsvpDeadline={settings.rsvpDeadline}
          venueName={settings.venueName}
          venueAddress={settings.venueAddress}
          weddingDateLabel={dateLabel}
        />
      </main>
    </>
  );
}
