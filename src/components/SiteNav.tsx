"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HOME_ANCHORS: { href: string; label: string }[] = [
  { href: "/celebration#story", label: "סיפור" },
  { href: "/celebration#moments", label: "רגעים" },
  { href: "/celebration#gallery", label: "גלריה" },
  { href: "/celebration#venue", label: "מיקום" },
  { href: "/celebration#schedule", label: "סדר היום" },
  { href: "/celebration#faq", label: "שאלות" }
];

const PAGE_LINKS: { href: string; label: string }[] = [
  { href: "/", label: "הגלריה" }
];

export function SiteNav() {
  const pathname = usePathname();
  const onCelebration = pathname === "/celebration";
  const links = onCelebration ? HOME_ANCHORS : PAGE_LINKS;

  return (
    <nav
      aria-label="ניווט ראשי"
      style={{
        position: "fixed",
        bottom: 18,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        background: "rgba(245, 239, 228, 0.78)",
        border: "1px solid var(--hair-strong)",
        borderRadius: 9999,
        padding: "8px 14px",
        boxShadow: "var(--shadow)",
        maxWidth: "calc(100vw - 32px)",
        overflowX: "auto"
      }}
      className="no-scrollbar"
    >
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          gap: 4,
          alignItems: "center"
        }}
      >
        {onCelebration ? (
          <li>
            <Link
              href="/"
              style={{
                display: "inline-block",
                padding: "6px 12px",
                fontFamily: "Heebo",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--ink-2)",
                textDecoration: "none",
                whiteSpace: "nowrap"
              }}
            >
              הגלריה
            </Link>
          </li>
        ) : null}
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              style={{
                display: "inline-block",
                padding: "6px 12px",
                fontFamily: "Heebo",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--ink-2)",
                textDecoration: "none",
                whiteSpace: "nowrap"
              }}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
