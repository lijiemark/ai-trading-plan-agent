"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/plan", label: "Plan" },
  { href: "/trade", label: "Trade" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      className="inline-flex rounded-xl border border-white/15 bg-white/10 p-1 backdrop-blur-md"
      aria-label="Primary"
    >
      {links.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-4 py-2 text-sm font-bold tracking-wide transition-all duration-200 ${
              active
                ? "bg-white text-slate-900 shadow-lg shadow-cyan-500/20"
                : "text-blue-100/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            {link.label.toUpperCase()}
          </Link>
        );
      })}
    </nav>
  );
}
