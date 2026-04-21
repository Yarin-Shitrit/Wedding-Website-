import Link from "next/link";
import { ReactNode } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/guests", label: "Guests" },
  { href: "/admin/tables", label: "Tables" },
  { href: "/admin/settings", label: "Settings" }
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-sand-50">
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-stone-100 p-5">
        <Link href="/admin" className="font-display text-xl text-rose-600 mb-6">
          Couple Admin
        </Link>
        <nav className="flex flex-col gap-1">
          {navItems.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-rose-50 hover:text-rose-600"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-6 text-xs text-stone-500">
          <Link href="/" className="hover:text-rose-600">
            ← Back to site
          </Link>
          <form action="/api/admin/logout" method="post" className="mt-2">
            <button className="text-stone-500 hover:text-rose-600" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10 max-w-6xl">{children}</main>
    </div>
  );
}
