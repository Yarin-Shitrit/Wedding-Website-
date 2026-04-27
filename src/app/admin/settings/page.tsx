import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <div>
      <h1
        className="display"
        style={{ fontSize: 28, color: "var(--ink)", margin: 0 }}
      >
        Settings
      </h1>
      <p style={{ color: "var(--ink-3)", marginTop: 4, fontSize: 14 }}>
        These details appear throughout the guest site.
      </p>
      <div style={{ marginTop: 24 }}>
        <SettingsForm
          initial={{
            brideName: s.brideName,
            groomName: s.groomName,
            weddingDate: new Date(s.weddingDate).toISOString().slice(0, 16),
            venueName: s.venueName,
            venueAddress: s.venueAddress,
            venueMapUrl: s.venueMapUrl,
            parkingInfo: s.parkingInfo,
            shuttleInfo: s.shuttleInfo,
            dressCode: s.dressCode,
            welcomeMessage: s.welcomeMessage,
            storyTitle: s.storyTitle,
            storyEyebrow: s.storyEyebrow,
            storyBody: s.storyBody,
            storyQuote: s.storyQuote,
            heroLayout: (s.heroLayout as "centered" | "split") ?? "centered",
            palette: s.palette ?? "terracotta",
            rsvpDeadline: s.rsvpDeadline ?? "12.10"
          }}
        />
      </div>
    </div>
  );
}
