import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-[1440px] flex-col items-start gap-6 px-4 py-24 sm:px-8">
      <span className="font-display text-[clamp(96px,18vw,240px)] leading-[0.8] text-accent">404</span>
      <h1 className="font-display text-5xl uppercase">Página não encontrada</h1>
      <Link
        href="/"
        className="flex min-h-14 items-center bg-accent px-7 font-bold tracking-wider text-ink uppercase hover:bg-accent-soft"
      >
        Voltar à linha do tempo →
      </Link>
    </section>
  );
}
