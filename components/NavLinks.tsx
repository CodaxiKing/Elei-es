"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { menu } from "@/lib/navegacao";

function isAtivo(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/mandato/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Principal"
      className="flex w-full gap-1.5 overflow-x-auto lg:w-auto lg:flex-1 lg:justify-end"
    >
      {menu.map((item) => {
        const ativo = isAtivo(pathname, item.href);
        const cores = item.aoVivo
          ? "bg-accent text-ink hover:bg-accent-soft"
          : ativo
            ? "bg-paper text-ink"
            : "text-paper hover:bg-surface-2";
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-2 px-3.5 text-sm font-bold tracking-wider whitespace-nowrap uppercase ${cores}`}
          >
            {item.aoVivo && (
              <span aria-hidden="true" className="size-2 animate-pulse-dot rounded-full bg-ink" />
            )}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
