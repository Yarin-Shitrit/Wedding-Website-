import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <div>
      <h1 className="text-3xl font-display text-stone-800">Settings</h1>
      <p className="text-stone-500 mt-1">These details appear throughout the guest site.</p>
      <div className="mt-6">
        <SettingsForm
          initial={{
            brideName: s.brideName,
            groomName: s.groomName,
            weddingDate: s.weddingDate.toISOString().slice(0, 16),
            venueName: s.venueName,
            venueAddress: s.venueAddress,
            venueMapUrl: s.venueMapUrl,
            parkingInfo: s.parkingInfo,
            dressCode: s.dressCode,
            welcomeMessage: s.welcomeMessage
          }}
        />
      </div>
    </div>
  );
}
