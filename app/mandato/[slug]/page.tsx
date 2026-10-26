import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmConstrucao } from "@/components/EmConstrucao";
import { RaioX } from "@/components/RaioX";
import { getMandato, mandatos, numeroLabel, periodo } from "@/lib/mandatos";

export function generateStaticParams() {
  return mandatos.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata(props: PageProps<"/mandato/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const m = getMandato(slug);
  if (!m) notFound();
  return { title: `${m.presidente} (${m.inicio.slice(0, 4)}–${m.fim.slice(0, 4)})` };
}

const secoes = [
  { id: "resumo", titulo: "Resumo", fase: 4, texto: "Indicadores no dia da posse e no fim do mandato." },
  {
    id: "raiox",
    titulo: "Raio-X social",
    fase: 4,
    texto:
      "Desemprego, fome (insegurança alimentar grave e Mapa da Fome da ONU), extrema pobreza, desigualdade, renda, homicídios, mortalidade infantil, expectativa de vida, desmatamento e informalidade, na posse e no fim.",
  },
  { id: "precos", titulo: "Preços", fase: 4, texto: "Cesta básica, alimentos e combustíveis, com valor nominal e corrigido pelo IPCA." },
  { id: "emprego", titulo: "Emprego", fase: 4, texto: "Desocupação (PNAD Contínua), saldo de empregos formais (CAGED) e salário mínimo real." },
  { id: "divida", titulo: "Dívida pública", fase: 4, texto: "Dívida bruta e líquida em relação ao PIB e a Selic." },
  { id: "fez", titulo: "O que fez", fase: 5, texto: "Leis, emendas, programas e crises do mandato, com o número do ato." },
  { id: "impostos", titulo: "Impostos", fase: 5, texto: "Tributos criados, aumentados, reduzidos ou extintos, e para que servem." },
  { id: "propostas", titulo: "Propostas", fase: 5, texto: "Plano de governo registrado no TSE, com status e evidência de cada proposta." },
];

type Params = PageProps<"/mandato/[slug]">["params"];

export default function MandatoPage(props: PageProps<"/mandato/[slug]">) {
  // params é dado da URL: lido dentro do Suspense para a navegação continuar instantânea.
  return (
    <Suspense fallback={<MandatoCarregando />}>
      <MandatoConteudo params={props.params} />
    </Suspense>
  );
}

function MandatoCarregando() {
  return (
    <div aria-busy="true" aria-label="Carregando mandato" className="border-b border-line">
      <div className="mx-auto flex min-h-[560px] max-w-[1440px] flex-wrap">
        <div className="min-h-[420px] flex-[1_1_420px] animate-pulse bg-surface" />
        <div className="flex flex-[1.3_1_560px] flex-col gap-4 px-4 py-12 sm:px-8">
          <div className="h-8 w-48 animate-pulse bg-surface-2" />
          <div className="h-24 w-3/4 animate-pulse bg-surface-2" />
        </div>
      </div>
    </div>
  );
}

async function MandatoConteudo({ params }: { params: Params }) {
  const { slug } = await params;
  const m = getMandato(slug);
  if (!m) notFound();

  const i = mandatos.indexOf(m);
  const anterior = mandatos[i - 1];
  const proximo = mandatos[i + 1];
  const [primeiroNome, ...resto] = m.presidente.split(" ");

  return (
    <>
      <section aria-label="Banner do presidente" className="border-b border-line">
        <div className="mx-auto flex min-h-[560px] max-w-[1440px] flex-wrap">
          <div className="relative min-h-[340px] min-w-0 flex-[1_1_420px] sm:min-h-[420px] overflow-hidden border-line bg-surface sm:border-r">
            <Image
              src={m.foto.src}
              alt={`Foto oficial de ${m.presidente}`}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 45vw"
              className="object-cover object-[center_18%] contrast-125 grayscale"
            />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[30%] bg-accent mix-blend-multiply" />
            <div aria-hidden="true" className="absolute inset-y-0 left-0 w-3.5 bg-accent" />
            <span className="absolute top-6 left-9 bg-paper px-2.5 py-1.5 font-mono text-[11px] font-bold text-ink uppercase">
              Foto: {m.foto.credito}
            </span>
          </div>

          <div className="flex min-w-0 flex-[1.3_1_560px] flex-col justify-between gap-9 px-4 py-12 sm:px-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2.5 font-mono text-[13px] font-bold">
                <span className="bg-accent px-2.5 py-1.5 text-ink">MANDATO {numeroLabel(m)}/09</span>
                <span
                  className={`border px-2.5 py-[5px] ${m.emAndamento ? "border-accent text-accent" : "border-muted text-muted"}`}
                >
                  {m.emAndamento ? "EM ANDAMENTO · DADOS PARCIAIS" : "ENCERRADO"}
                </span>
              </div>
              <h1 className="font-display leading-[0.85] uppercase">
                <span className="block text-[clamp(36px,6vw,96px)] text-transparent [-webkit-text-stroke:2px_var(--color-paper)]">
                  {primeiroNome}
                </span>
                <span className="block text-[clamp(44px,8.5vw,140px)] text-accent">{resto.join(" ")}</span>
              </h1>
              <span className="font-mono text-xl">{periodo(m)}</span>
            </div>
            <nav aria-label="Outros mandatos" className="flex flex-wrap gap-2">
              {anterior && (
                <Link
                  href={`/mandato/${anterior.slug}`}
                  className="flex min-h-12 items-center border border-line px-4 text-[13px] font-bold uppercase hover:border-paper"
                >
                  ← {anterior.curto}
                </Link>
              )}
              {proximo && (
                <Link
                  href={`/mandato/${proximo.slug}`}
                  className="flex min-h-12 items-center border border-line px-4 text-[13px] font-bold uppercase hover:border-paper"
                >
                  {proximo.curto} →
                </Link>
              )}
            </nav>
          </div>
        </div>
      </section>

      <nav aria-label="Seções do mandato" className="bg-paper">
        <div className="mx-auto flex max-w-[1440px] flex-wrap px-4 text-sm font-bold tracking-wider uppercase sm:px-8">
          {secoes.map((s, n) => (
            <a key={s.id} href={`#${s.id}`} className="px-4 py-[18px] text-ink hover:bg-accent">
              {String(n).padStart(2, "0")} {s.titulo}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto flex max-w-[1440px] flex-col gap-14 px-4 py-14 pb-22 sm:px-8">
        {secoes.map((s, n) => (
          <section key={s.id} id={s.id} aria-labelledby={`h-${s.id}`} className="flex flex-col gap-5 scroll-mt-6">
            <div className="flex items-end gap-5">
              <span
                aria-hidden="true"
                className="font-display text-[110px] leading-[0.8] text-transparent [-webkit-text-stroke:2px_var(--color-accent)]"
              >
                {String(n).padStart(2, "0")}
              </span>
              <h2 id={`h-${s.id}`} className="font-display text-5xl leading-[0.95] uppercase sm:text-6xl">
                {s.titulo}
              </h2>
            </div>
            {s.id === "raiox" ? <RaioX m={m} /> : <EmConstrucao fase={s.fase}>{s.texto}</EmConstrucao>}
          </section>
        ))}
      </div>
    </>
  );
}
