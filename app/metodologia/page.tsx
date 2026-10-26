import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";

export const metadata: Metadata = { title: "Metodologia" };

const fontes = [
  ["Cesta básica", "DIEESE — Pesquisa Nacional da Cesta Básica"],
  ["Combustíveis", "ANP — Levantamento de Preços de Combustíveis"],
  ["Inflação (IPCA)", "IBGE — SIDRA"],
  ["Desemprego", "IBGE — PNAD Contínua"],
  ["Empregos formais", "MTE — Novo CAGED"],
  ["Dívida pública, Selic e dólar", "Banco Central — SGS"],
  ["Leis, emendas e impostos", "Portal da Legislação do Planalto e Receita Federal"],
  ["Planos de governo e votos", "TSE — DivulgaCandContas e Portal de Dados Abertos"],
  ["Fotos oficiais", "Wikimedia Commons (CC BY / atribuição)"],
];

export default function MetodologiaPage() {
  return (
    <>
      <PageTitle eyebrow="COMO OS NÚMEROS SÃO FEITOS" linha1="Metodo" linha2="logia">
        <p>Mesmos critérios para todos os governos. Todo número tem fonte oficial e data de coleta.</p>
      </PageTitle>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-12 px-4 pb-22 sm:px-8">
        <section aria-labelledby="h-regras" className="flex max-w-3xl flex-col gap-4 text-lg">
          <h2 id="h-regras" className="font-display text-4xl uppercase">Regras</h2>
          <ul className="flex list-disc flex-col gap-2 pl-6 text-muted marker:text-accent">
            <li>Início do mandato é o mês da posse; fim é o último mês completo do mandato.</li>
            <li>Preços aparecem em valor nominal e corrigidos pelo IPCA.</li>
            <li>Mandatos em andamento usam o último dado disponível e são marcados como parciais.</li>
            <li>Quebras de série (PME → PNAD Contínua, CAGED → Novo CAGED) são indicadas nos gráficos.</li>
          </ul>
        </section>
        <section aria-labelledby="h-fontes" className="flex flex-col gap-4">
          <h2 id="h-fontes" className="font-display text-4xl uppercase">Fontes</h2>
          <div className="overflow-x-auto border-2 border-paper">
            <table className="w-full min-w-[560px] border-collapse text-[15px]">
              <thead>
                <tr className="bg-paper text-left text-xs tracking-wider text-ink uppercase">
                  <th scope="col" className="px-4 py-3">Dado</th>
                  <th scope="col" className="px-4 py-3">Fonte</th>
                </tr>
              </thead>
              <tbody>
                {fontes.map(([dado, fonte]) => (
                  <tr key={dado} className="border-t border-line">
                    <th scope="row" className="px-4 py-3 text-left font-bold">{dado}</th>
                    <td className="px-4 py-3 text-muted">{fonte}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section id="dados" aria-labelledby="h-dados" className="flex max-w-3xl flex-col gap-4 text-lg">
          <h2 id="h-dados" className="font-display text-4xl uppercase">Dados abertos</h2>
          <p className="text-muted">
            Os arquivos tratados (CSV e JSON) ficarão disponíveis para download aqui a partir da fase 2.
          </p>
        </section>
      </div>
    </>
  );
}
