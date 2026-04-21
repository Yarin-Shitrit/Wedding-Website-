"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Table2,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { he } from "@/messages/he";

const items = [
  { href: "/admin/dashboard", label: he.admin.dashboard, Icon: LayoutDashboard },
  { href: "/admin/guests", label: he.admin.guests, Icon: Users },
  { href: "/admin/tables", label: he.admin.tables, Icon: Table2 },
  { href: "/admin/content", label: he.admin.content, Icon: FileText },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await fetch("/api/auth/admin", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row">
      <aside
        className={cn(
          "md:w-64 md:min-h-[100dvh] md:border-l md:border-sage-100 bg-white md:sticky md:top-0",
          "flex md:flex-col md:py-6"
        )}
      >
        <div className="flex items-center justify-between w-full md:w-auto px-4 md:px-6 py-3 md:py-0">
          <Link href="/admin/dashboard" className="font-display text-lg font-semibold">
            ניהול חתונה
          </Link>
          <button
            className="md:hidden p-2"
            onClick={() => setOpen((v) => !v)}
            aria-label="תפריט"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        <nav
          className={cn(
            "md:flex md:flex-col md:mt-6 md:px-3 md:flex-1",
            open ? "flex flex-col w-full border-t border-sage-100" : "hidden"
          )}
        >
          {items.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl2 px-3 py-3 md:py-2 text-sm",
                  active
                    ? "bg-sage-100 text-sage-700"
                    : "text-ink hover:bg-sage-50"
                )}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
          <button
            onClick={signOut}
            className="mt-auto md:mt-auto flex items-center gap-3 rounded-xl2 px-3 py-3 md:py-2 text-sm text-ink hover:bg-sage-50"
          >
            <LogOut size={18} />
            <span>{he.admin.signOut}</span>
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
