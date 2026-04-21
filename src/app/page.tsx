import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { Countdown } from "@/components/Countdown";
import { getSettings } from "@/lib/settings";

export default async function HomePage() {
  const s = await getSettings();
  const date = s.weddingDate.toISOString();
  const formatted = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short"
  }).format(s.weddingDate);

  return (
    <>
      <SiteNav />
      <main>
        <section className="relative">
          <div className="max-w-5xl mx-auto px-6 py-24 text-center">
            <p className="uppercase tracking-[0.4em] text-sm text-rose-500">We're getting married</p>
            <h1 className="mt-4 text-6xl sm:text-7xl text-rose-600">
              {s.brideName} <span className="text-stone-400">&amp;</span> {s.groomName}
            </h1>
            <p className="mt-6 text-stone-600">{formatted}</p>
            {s.venueName && (
              <p className="text-stone-600">
                {s.venueName}
                {s.venueAddress ? ` · ${s.venueAddress}` : ""}
              </p>
            )}
            <div className="mt-10">
              <Countdown isoDate={date} />
            </div>
            <div className="mt-10 flex gap-3 justify-center">
              <Link href="/rsvp" className="btn-primary">
                RSVP
              </Link>
              <Link href="/venue" className="btn-secondary">
                Venue &amp; map
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-24 grid gap-6 sm:grid-cols-3">
          <Link href="/rsvp" className="card hover:shadow-md transition">
            <h2 className="text-2xl text-rose-600">RSVP</h2>
            <p className="mt-2 text-stone-600 text-sm">
              Confirm your attendance and number of seats. You can update your answer anytime.
            </p>
          </Link>
          <Link href="/venue" className="card hover:shadow-md transition">
            <h2 className="text-2xl text-rose-600">Venue</h2>
            <p className="mt-2 text-stone-600 text-sm">
              Directions, map, and everything you need to arrive on time.
            </p>
          </Link>
          <Link href="/info" className="card hover:shadow-md transition">
            <h2 className="text-2xl text-rose-600">Guest info</h2>
            <p className="mt-2 text-stone-600 text-sm">
              Parking, dress code, schedule, and frequently asked questions.
            </p>
          </Link>
        </section>

        {s.welcomeMessage && (
          <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
            <p className="text-lg text-stone-700 italic">"{s.welcomeMessage}"</p>
          </section>
        )}
      </main>
    </>
  );
}
