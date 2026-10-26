import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-accent text-ink">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 pt-12 pb-6 sm:px-8">
        <div className="grid grid-cols-1 gap-8 text-[15px] font-medium sm:grid-cols-3">
          <p>Projeto independente e apartidário. Mesmos critérios para todos os governos.</p>
          <p>
            Fontes: IBGE · Banco Central · ANP · DIEESE · CAGED · TSE · Planalto. Fotos oficiais:
            Wikimedia Commons, com crédito em cada imagem.
          </p>
          <p className="flex flex-wrap gap-5 font-bold">
            <Link href="/metodologia" className="underline underline-offset-4">
              Metodologia
            </Link>
            <Link href="/metodologia#dados" className="underline underline-offset-4">
              Dados abertos
            </Link>
          </p>
        </div>
        <span
          aria-hidden="true"
          className="font-display text-[clamp(64px,13vw,200px)] leading-[0.85] uppercase"
        >
          Observatório
        </span>
      </div>
    </footer>
  );
}
