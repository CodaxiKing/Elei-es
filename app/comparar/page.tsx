import type { Metadata } from "next";
import { EmConstrucao } from "@/components/EmConstrucao";
import { PageTitle } from "@/components/PageTitle";

export const metadata: Metadata = { title: "Comparar mandatos" };

export default function CompararPage() {
  return (
    <>
      <PageTitle eyebrow="COMPARADOR" linha1="Quem deixou o país" linha2="como encontrou?">
        <p>Dois mandatos lado a lado: variação do primeiro ao último mês, corrigida pelo IPCA.</p>
      </PageTitle>
      <section className="mx-auto max-w-[1440px] px-4 pb-22 sm:px-8">
        <EmConstrucao fase={6}>
          Seleção de dois mandatos e barras de variação para cesta básica, combustíveis, desemprego,
          salário mínimo real, dívida e dólar.
        </EmConstrucao>
      </section>
    </>
  );
}
