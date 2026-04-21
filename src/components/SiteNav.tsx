import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/rsvp", label: "RSVP" },
  { href: "/venue", label: "Venue" },
  { href: "/info", label: "Guest Info" }
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-20 backdrop-blur bg-sand-50/80 border-b border-stone-100">
      <nav className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-xl text-rose-600">
          A &amp; B
        </Link>
        <ul className="flex gap-5 text-sm">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-stone-700 hover:text-rose-600">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
