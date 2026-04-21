import { redirect } from "next/navigation";
import { getGuestSession } from "@/lib/auth";
import { PhoneLookupForm } from "@/components/public/PhoneLookupForm";
import { he } from "@/messages/he";

export const dynamic = "force-dynamic";

export default async function RsvpEntryPage() {
  const session = await getGuestSession();
  if (session) {
    redirect(`/rsvp/${encodeURIComponent(session.phone)}`);
  }

  return (
    <section className="py-16">
      <div className="max-w-md mx-auto px-4 sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-center mb-2">
          {he.rsvp.title}
        </h1>
        <p className="text-center text-ink/70 mb-8">{he.rsvp.enterPhone}</p>
        <div className="card">
          <PhoneLookupForm />
        </div>
      </div>
    </section>
  );
}
