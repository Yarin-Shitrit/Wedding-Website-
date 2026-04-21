import { SectionNav } from "@/components/public/SectionNav";

const bride = process.env.NEXT_PUBLIC_BRIDE_NAME ?? "כלה";
const groom = process.env.NEXT_PUBLIC_GROOM_NAME ?? "חתן";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <SectionNav coupleLabel={`${bride} & ${groom}`} />
      <main>{children}</main>
      <footer className="py-10 text-center text-xs text-ink/50">
        נעשה באהבה ❤
      </footer>
    </div>
  );
}
