import { prisma } from "@/lib/db";
import { SectionNav } from "@/components/public/SectionNav";

const bride = process.env.NEXT_PUBLIC_BRIDE_NAME ?? "כלה";
const groom = process.env.NEXT_PUBLIC_GROOM_NAME ?? "חתן";

export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [heroBlock, photoCount, stationCount] = await Promise.all([
    prisma.contentBlock.findUnique({ where: { key: "hero" } }),
    prisma.photo.count(),
    prisma.station.count(),
  ]);
  const heroValue = (heroBlock?.valueJson as Record<string, unknown> | null) ?? null;
  const avatar = (heroValue?.heroImageUrl as string) || null;

  return (
    <div>
      <SectionNav
        coupleLabel={`${bride} & ${groom}`}
        avatar={avatar}
        showGallery={photoCount > 0}
        showStations={stationCount > 0}
      />
      <main>{children}</main>
      <footer className="py-10 text-center text-xs text-ink/50">
        נעשה באהבה ❤
      </footer>
    </div>
  );
}
