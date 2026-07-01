import { SiteNav } from "@/components/SiteNav";
import { Hero } from "@/components/sections/Hero";
import { Story } from "@/components/sections/Story";
import { Moments } from "@/components/sections/Moments";
import { Gallery } from "@/components/sections/Gallery";
import { Venue } from "@/components/sections/Venue";
import { Schedule } from "@/components/sections/Schedule";
import { Parking } from "@/components/sections/Parking";
import { Faq } from "@/components/sections/Faq";
import { RsvpCta } from "@/components/sections/RsvpCta";
import { Footer } from "@/components/sections/Footer";
import { SectionDots } from "@/components/sections/SectionDots";
import { getSettings } from "@/lib/settings";
import { formatHebrewDate } from "@/lib/date";
import {
  getMoments,
  getGalleryItems,
  getScheduleItems,
  getFaqItems
} from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function CelebrationPage() {
  const [settings, moments, gallery, schedule, faq] = await Promise.all([
    getSettings(),
    getMoments(),
    getGalleryItems(),
    getScheduleItems(),
    getFaqItems()
  ]);

  const dateLabel = formatHebrewDate(new Date(settings.weddingDate));
  const dateIso = new Date(settings.weddingDate).toISOString();
  const venueLine = [settings.venueName, settings.venueAddress, "קבלת פנים 19:00"]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <SiteNav />
      <main>
        <Hero
          bride={settings.brideName}
          groom={settings.groomName}
          dateLabel={dateLabel}
          dateIso={dateIso}
          venueLine={venueLine}
        />
        <SectionDots />
        <Story
          eyebrow={settings.storyEyebrow}
          title={settings.storyTitle}
          body={settings.storyBody}
          quote={settings.storyQuote}
        />
        <Moments moments={moments} />
        <Gallery items={gallery} />
        <Venue
          venueName={settings.venueName}
          venueAddress={settings.venueAddress}
          venueMapUrl={settings.venueMapUrl}
        />
        <Schedule items={schedule} />
        <Parking
          parkingInfo={settings.parkingInfo}
          shuttleInfo={settings.shuttleInfo}
          dressCode={settings.dressCode}
        />
        <Faq items={faq} />
        <RsvpCta deadline={settings.rsvpDeadline} />
        <Footer
          bride={settings.brideName}
          groom={settings.groomName}
          dateLabel={dateLabel}
        />
      </main>
    </>
  );
}
