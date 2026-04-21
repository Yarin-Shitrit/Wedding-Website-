import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestSession } from "@/lib/auth";
import { RsvpForm } from "@/components/public/RsvpForm";
import { he } from "@/messages/he";

export const dynamic = "force-dynamic";

export default async function RsvpEditPage() {
  const session = await getGuestSession();
  if (!session) redirect("/rsvp");

  const guest = await prisma.guest.findUnique({
    where: { id: session.guestId },
    include: { table: true },
  });
  if (!guest) redirect("/rsvp");

  return (
    <section className="py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-center">
          {he.rsvp.title_greet} {guest.firstName}!
        </h1>
        <p className="text-center text-ink/70 mt-2 mb-8">
          {guest.invitedCount > 1
            ? `הוזמנתם ${guest.invitedCount} אורחים`
            : "הוזמנתם להשתתף בשמחתנו"}
        </p>
        <div className="card">
          <RsvpForm
            guest={{
              invitedCount: guest.invitedCount,
              rsvpStatus: guest.rsvpStatus,
              attendingCount: guest.attendingCount,
              dietary: guest.dietary,
              notes: guest.notes,
            }}
          />
        </div>
      </div>
    </section>
  );
}
