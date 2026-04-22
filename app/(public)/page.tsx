import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
import { Countdown } from "@/components/public/Countdown";
import { Section } from "@/components/public/Section";
import { VenueMap } from "@/components/public/VenueMap";
import { Gallery } from "@/components/public/Gallery";
import { Postcards } from "@/components/public/Postcards";
import { he } from "@/messages/he";

const bride = process.env.NEXT_PUBLIC_BRIDE_NAME ?? "כלה";
const groom = process.env.NEXT_PUBLIC_GROOM_NAME ?? "חתן";
const weddingDate =
  process.env.NEXT_PUBLIC_WEDDING_DATE ?? "2026-09-15T19:00:00+03:00";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("he-IL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function HomePage() {
  const [blocks, photos, stations] = await Promise.all([
    prisma.contentBlock.findMany(),
    prisma.photo.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.station.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  const content = Object.fromEntries(
    blocks.map((b) => [b.key, b.valueJson as Record<string, unknown>])
  );

  const hero = content.hero ?? {};
  const story = content.story ?? {};
  const venue = content.venue ?? {};
  const parking = content.parking ?? {};
  const gift = content.gift ?? {};
  const heroImage = (hero.heroImageUrl as string) || null;

  return (
    <>
      <Section id="hero">
        <div className="text-center">
          {heroImage && (
            <div className="mx-auto mb-8 max-w-sm">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl2 shadow-soft ring-1 ring-sage-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroImage}
                  alt={`${bride} ו${groom}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          <p className="text-sm tracking-[0.3em] text-sage-700 uppercase">
            {(hero.subtitle as string) ?? "ונשמח לחגוג איתכם"}
          </p>
          <h1 className="font-display text-4xl sm:text-6xl font-semibold mt-3">
            {bride} <span className="text-blush-500">&</span> {groom}
          </h1>
          <p className="mt-3 text-ink/70">{formatDate(weddingDate)}</p>
          <div className="mt-8">
            <Countdown dateIso={weddingDate} />
          </div>
          <Link href="/rsvp" className="btn-primary mt-8 text-base px-6 py-3">
            {he.rsvp.title}
          </Link>
        </div>
      </Section>

      <Section id="story" title={(story.title as string) ?? he.nav.story}>
        <p className="text-center text-ink/80 leading-relaxed">
          {(story.body as string) ?? ""}
        </p>
      </Section>

      {photos.length > 0 && (
        <Section id="gallery" title={he.gallery.title}>
          <p className="text-center text-sm text-ink/60 -mt-2 mb-6">
            {he.gallery.subtitle}
          </p>
          <Gallery
            photos={photos.map((p) => ({
              id: p.id,
              dataUrl: p.dataUrl,
              caption: p.caption,
            }))}
          />
        </Section>
      )}

      {stations.length > 0 && (
        <Section id="stations" title={he.stations.title}>
          <p className="text-center text-sm text-ink/60 -mt-2 mb-8">
            {he.stations.subtitle}
          </p>
          <Postcards
            stations={stations.map((s) => ({
              id: s.id,
              title: s.title,
              description: s.description,
              dataUrl: s.dataUrl,
            }))}
          />
        </Section>
      )}

      <Section id="venue" title={he.nav.venue}>
        <VenueMap value={venue as any} />
      </Section>

      <Section id="parking" title={(parking.title as string) ?? he.nav.parking}>
        <div className="card prose prose-sm max-w-none text-ink/80 leading-relaxed">
          <ReactMarkdown>{(parking.body as string) ?? ""}</ReactMarkdown>
        </div>
      </Section>

      {gift.body ? (
        <Section id="gift" title={(gift.title as string) ?? "מתנה"}>
          <p className="text-center text-ink/80">{gift.body as string}</p>
        </Section>
      ) : null}
    </>
  );
}
