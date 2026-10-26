import type { Metadata } from "next";
import { EmConstrucao } from "@/components/EmConstrucao";
import { PageTitle } from "@/components/PageTitle";

export const metadata: Metadata = { title: "Mapa dos votos" };

export default function MapaPage() {
  return (
    <>
      <PageTitle eyebrow="ELEIÇÕES 1994 → 2022" linha1="Mapa dos" linha2="votos">
        <p>Passe o mouse sobre um estado ou região para ver quantos votos o presidente eleito recebeu ali.</p>
      </PageTitle>
      <section className="mx-auto max-w-[1440px] px-4 pb-22 sm:px-8">
        <EmConstrucao fase={6}>
          Mapa por estado com os votos do TSE. Os dados já estão prontos em
          data/votos-presidente-uf.json e os contornos em data/mapa-uf.json.
        </EmConstrucao>
      </section>
    </>
  );
}
