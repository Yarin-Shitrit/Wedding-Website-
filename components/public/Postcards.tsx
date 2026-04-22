type Station = {
  id: string;
  title: string;
  description: string;
  dataUrl: string;
};

export function Postcards({ stations }: { stations: Station[] }) {
  if (stations.length === 0) return null;

  return (
    <ul className="grid sm:grid-cols-2 gap-6 sm:gap-8">
      {stations.map((s, i) => (
        <li
          key={s.id}
          className={`postcard ${i % 2 === 0 ? "rotate-[-1deg]" : "rotate-[1deg]"}`}
        >
          <div className="bg-white rounded-sm shadow-soft p-3 sm:p-4">
            <div className="aspect-[4/3] overflow-hidden bg-sage-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.dataUrl}
                alt={s.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mt-3 sm:mt-4 text-center">
              <h3 className="font-display text-xl sm:text-2xl">{s.title}</h3>
              <p className="mt-1 text-sm text-ink/70 leading-relaxed whitespace-pre-line">
                {s.description}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
