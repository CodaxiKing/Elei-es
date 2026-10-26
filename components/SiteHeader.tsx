import Link from "next/link";
import { NavLinks } from "@/components/NavLinks";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-7 gap-y-3 px-4 py-4 sm:px-8">
        <Link
          href="/"
          className="font-display text-2xl leading-none tracking-wide text-paper uppercase"
        >
          Observatório<span className="text-accent">/</span>Presidência
        </Link>
        <NavLinks />
      </div>
    </header>
  );
}
