import type { Metadata } from "next";
import { EmConstrucao } from "@/components/EmConstrucao";
import { PageTitle } from "@/components/PageTitle";

export const metadata: Metadata = { title: "Apuração ao vivo" };

export default function ApuracaoPage() {
  return (
    <>
      <PageTitle eyebrow="DIA DE ELEIÇÃO" linha1="Apuração" linha2="ao vivo">
        <p>O mapa vai se pintando com a cor de quem lidera em cada estado enquanto os votos são somados.</p>
      </PageTitle>
      <section className="mx-auto max-w-[1440px] px-4 pb-22 sm:px-8">
        <EmConstrucao fase={6}>
          Fora do período eleitoral, esta aba mostra o replay da apuração de 2022 com os dados oficiais
          do TSE. Em dia de eleição, os números vêm da divulgação oficial em tempo real.
        </EmConstrucao>
      </section>
    </>
  );
}
