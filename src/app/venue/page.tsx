import { SiteNav } from "@/components/SiteNav";
import { getSettings } from "@/lib/settings";

export default async function VenuePage() {
  const s = await getSettings();
  const mapSrc = s.venueAddress
    ? `https://www.google.com/maps?q=${encodeURIComponent(s.venueAddress)}&output=embed`
    : null;

  return (
    <>
      <SiteNav />
      <main className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl text-rose-600 text-center">The Venue</h1>
        <p className="mt-2 text-center text-stone-600">
          {s.venueName}
          {s.venueAddress ? ` · ${s.venueAddress}` : ""}
        </p>

        <div className="mt-10 card overflow-hidden p-0">
          {mapSrc ? (
            <iframe
              title="Venue map"
              src={mapSrc}
              className="w-full aspect-[16/9] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div className="p-10 text-center text-stone-500">
              Add a venue address in the admin panel to display a map.
            </div>
          )}
        </div>

        {s.venueMapUrl && (
          <div className="mt-6 text-center">
            <a href={s.venueMapUrl} target="_blank" rel="noreferrer" className="btn-secondary">
              Open in Google Maps
            </a>
          </div>
        )}
      </main>
    </>
  );
}
