import { SiteNav } from "@/components/SiteNav";
import { getSettings } from "@/lib/settings";

export default async function InfoPage() {
  const s = await getSettings();

  const sections = [
    {
      title: "Parking",
      body:
        s.parkingInfo ||
        "Free parking is available at the venue starting 18:00. Valet service is offered at the main entrance. Look for signs directing to guest parking."
    },
    {
      title: "Dress code",
      body: s.dressCode || "Cocktail / Elegant — wear something you feel wonderful in."
    },
    {
      title: "Arrival",
      body:
        "Doors open 45 minutes before the ceremony. Please arrive early so we can start on time — you'll want to catch every moment."
    },
    {
      title: "Accessibility",
      body:
        "The venue is fully accessible with ramps and elevators. Let us know if you need any special arrangement and we'll take care of it."
    }
  ];

  return (
    <>
      <SiteNav />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl text-rose-600 text-center">Guest information</h1>
        <p className="mt-2 text-center text-stone-600">Everything you need to know for the big day.</p>

        <div className="mt-10 space-y-4">
          {sections.map((sec) => (
            <details key={sec.title} className="card group" open>
              <summary className="cursor-pointer flex items-center justify-between font-display text-xl text-rose-600">
                {sec.title}
                <span className="text-stone-400 group-open:rotate-45 transition">+</span>
              </summary>
              <p className="mt-3 text-stone-700 whitespace-pre-line">{sec.body}</p>
            </details>
          ))}
        </div>
      </main>
    </>
  );
}
