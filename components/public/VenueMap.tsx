import { MapPin, Navigation } from "lucide-react";

type VenueValue = {
  name?: string;
  address?: string;
  embedUrl?: string;
  wazeUrl?: string;
  description?: string;
};

export function VenueMap({ value }: { value: VenueValue }) {
  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <MapPin className="text-sage-600 shrink-0 mt-1" size={22} />
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{value.name}</h3>
          <p className="text-ink/70">{value.address}</p>
          {value.description && (
            <p className="text-sm text-ink/60 mt-2">{value.description}</p>
          )}
        </div>
      </div>
      {value.embedUrl && (
        <div className="mt-4 rounded-xl2 overflow-hidden border border-sage-100">
          <iframe
            src={value.embedUrl}
            width="100%"
            height="320"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block w-full h-[280px] sm:h-[360px]"
            title="מפת המקום"
          />
        </div>
      )}
      {value.wazeUrl && (
        <a
          href={value.wazeUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-primary mt-4 w-full sm:w-auto"
        >
          <Navigation size={18} /> ניווט ב-Waze
        </a>
      )}
    </div>
  );
}
