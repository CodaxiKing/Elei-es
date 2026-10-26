import Image from "next/image";
import Link from "next/link";
import { EmConstrucao } from "@/components/EmConstrucao";
import { PageTitle } from "@/components/PageTitle";
import { anosLabel, mandatos, numeroLabel, periodo } from "@/lib/mandatos";

const marcosDoEixo = ["1995", "1999", "2003", "2007", "2011", "2015", "2019", "2023", "2026"];

export default function Home() {
  const atual = mandatos.find((m) => m.emAndamento);

  return (
    <>
      <PageTitle eyebrow="1995 → 2026 · 9 MANDATOS · 6 PRESIDENTES" linha1="Linha do" linha2="tempo">
        <p>
          Clique em um mandato para ver o que foi prometido, o que foi feito e como o país estava no
          início e no fim.
        </p>
      </PageTitle>

      <section aria-label="Mandatos de 1995 a 2026" className="mx-auto max-w-[1440px] px-4 sm:px-8">
        <div className="overflow-x-auto pb-1.5">
          <ol className="flex h-[300px] min-w-[1180px] gap-1">
            {mandatos.map((m) => (
              <li key={m.slug} className="min-w-0" style={{ flex: `${m.anos} 1 0` }}>
                <Link
                  href={`/mandato/${m.slug}`}
                  className="group relative block h-full overflow-hidden bg-surface outline-offset-[-4px] hover:outline-4 hover:outline-accent"
                >
                  <Image
                    src={m.foto.src}
                    alt=""
                    fill
                    sizes="(max-width: 1440px) 15vw, 200px"
                    className="object-cover object-[center_15%] brightness-[0.55] grayscale transition group-hover:brightness-100 group-hover:grayscale-0"
                  />
                  <span className="absolute top-0 left-0 bg-ink px-2 py-1.5 font-mono text-xs font-bold">
                    {numeroLabel(m)}
                  </span>
                  <span
                    className={`absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-3 ${
                      m.emAndamento ? "bg-accent text-ink" : "bg-ink/85 text-paper group-hover:bg-accent group-hover:text-ink"
                    }`}
                  >
                    <span className="truncate font-display text-[22px] leading-none uppercase">{m.curto}</span>
                    <span className="font-mono text-[11px] font-bold">{anosLabel(m)}</span>
                    <span className="sr-only">
                      {m.presidente}, {periodo(m)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <div aria-hidden="true" className="mt-1 flex h-2.5 min-w-[1180px] gap-1">
            {mandatos.map((m) => (
              <span
                key={m.slug}
                className={m.emAndamento ? "bg-accent" : "bg-line"}
                style={{ flex: `${m.anos} 1 0` }}
              />
            ))}
          </div>
          <div
            aria-hidden="true"
            className="mt-2.5 flex min-w-[1180px] justify-between font-mono text-xs font-bold text-muted"
          >
            {marcosDoEixo.map((ano) => (
              <span key={ano}>{ano}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pt-10 pb-22 sm:px-8">
        <EmConstrucao fase={3}>
          O painel do mandato selecionado (indicadores do início ao fim, o que fez, impostos e
          propostas) entra aqui. Por enquanto, cada bloco leva à página do mandato
          {atual ? `; o mandato atual é ${atual.curto}` : ""}.
        </EmConstrucao>
      </section>
    </>
  );
}
