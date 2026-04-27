import Link from "next/link";
import { ReactNode } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/guests", label: "Guests" },
  { href: "/admin/tables", label: "Tables" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/settings", label: "Settings" }
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div
      dir="ltr"
      lang="en"
      style={{ minHeight: "100vh", display: "flex", background: "var(--ivory)" }}
    >
      <aside
        style={{
          width: 224,
          flex: "none",
          background: "var(--paper)",
          borderInlineEnd: "1px solid var(--hair)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh"
        }}
      >
        <Link
          href="/admin"
          className="display"
          style={{
            fontSize: 20,
            color: "var(--accent)",
            textDecoration: "none",
            marginBottom: 24
          }}
        >
          Couple Admin
        </Link>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              style={{
                padding: "8px 12px",
                fontSize: 14,
                color: "var(--ink-2)",
                textDecoration: "none",
                borderInlineStart: "2px solid transparent",
                transition: "all .2s"
              }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div
          style={{
            marginTop: "auto",
            paddingTop: 24,
            fontSize: 12,
            color: "var(--ink-3)"
          }}
        >
          <Link
            href="/"
            style={{ color: "var(--ink-3)", textDecoration: "none" }}
          >
            ← Back to site
          </Link>
          <form action="/api/admin/logout" method="post" style={{ marginTop: 8 }}>
            <button
              type="submit"
              style={{
                background: "none",
                border: 0,
                padding: 0,
                color: "var(--ink-3)",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit"
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main style={{ flex: 1, padding: "32px 40px", maxWidth: 1080 }}>
        {children}
      </main>
    </div>
  );
}
