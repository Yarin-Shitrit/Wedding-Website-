"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { he } from "@/messages/he";

const links = [
  { href: "#hero", label: he.nav.home },
  { href: "#story", label: he.nav.story },
  { href: "#venue", label: he.nav.venue },
  { href: "#parking", label: he.nav.parking },
  { href: "/rsvp", label: he.nav.rsvp },
];

export function SectionNav({ coupleLabel }: { coupleLabel: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-ivory/90 backdrop-blur border-b border-sage-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="#hero" className="font-display text-lg sm:text-xl font-semibold">
          {coupleLabel}
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-sage-700">
              {l.label}
            </Link>
          ))}
        </nav>
        <button
          className="md:hidden p-2 -me-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="תפריט"
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <nav className="md:hidden border-t border-sage-100 bg-ivory">
          <ul className="max-w-5xl mx-auto px-4 py-2 flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-base"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
