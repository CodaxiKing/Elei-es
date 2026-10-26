import { AvisoParcial, CartaoDestaque, Fonte, Medicoes, NotaMetodo, TabelaComparacao } from "@/components/Comparacao";
import {
  atualizadoEm,
  comparar,
  escolherPontos,
  formatar,
  getSerie,
  medicoesNoMandato,
  rotuloPeriodo,
  type Ponto,
} from "@/lib/indicadores";
import type { Mandato } from "@/lib/mandatos";
import { desemprego, fome, indicadoresTabela, mapaDaFome, noMapaDaFome } from "@/lib/raiox";

export function RaioX({ m }: { m: Mandato }) {
  const cDesemprego = comparar(desemprego, m);
  const cFome = comparar(fome, m);
  const mapa = mapaDaFome(m);
  const penssan = medicoesNoMandato("fome_penssan_pessoas", m);
  const fomeIbgeNoMandato = medicoesNoMandato("fome_ibge_pessoas", m);
  const milhoes = (p: Ponto) => formatar(p.valor, "milhoes", 1);

  // Número de desempregados só existe na PNAD Contínua.
  let desocupados: React.ReactNode = null;
  if (cDesemprego.serieId === "desemprego_pnadc") {
    const { inicio, fim } = escolherPontos(getSerie("desocupados_pnadc").pontos, m.inicio, m.fim);
    if (inicio && fim) {
      const delta = (fim.valor - inicio.valor) / 1000;
      desocupados = (
        <span className="font-mono text-xs text-muted">
          {formatar(inicio.valor / 1000, "milhoes", 1)} → {formatar(fim.valor / 1000, "milhoes", 1)} de desempregados (
          {delta > 0 ? "+" : "−"}
          {formatar(Math.abs(delta), "milhoes", 1)})
        </span>
      );
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {m.emAndamento && <AvisoParcial />}

      <div className="flex flex-wrap gap-6">
        <CartaoDestaque
          titulo="Desemprego"
          unidade="da força de trabalho procurando emprego sem encontrar"
          c={cDesemprego}
          extra={desocupados}
          semDados={<p>Sem pesquisa de desemprego que cubra a posse e o fim deste mandato.</p>}
        />
        <CartaoDestaque
          titulo="Fome"
          unidade="pessoas em insegurança alimentar grave (IBGE)"
          c={cFome}
          extra={
            penssan.length > 0 && (
              <span className="font-mono text-xs text-muted">
                Rede PENSSAN: {penssan.map((p) => `${milhoes(p)} (${p.periodo})`).join(" · ")}
              </span>
            )
          }
          semDados={
            <>
              <p>O IBGE não mediu a fome na posse e no fim deste mandato.</p>
              {fomeIbgeNoMandato.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold tracking-wider uppercase">Medição do IBGE no período</span>
                  <Medicoes pontos={fomeIbgeNoMandato} formatarValor={milhoes} />
                </div>
              )}
              {penssan.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold tracking-wider uppercase">Outra pesquisa: Rede PENSSAN</span>
                  <Medicoes pontos={penssan} formatarValor={milhoes} />
                  <span className="text-xs text-dim">{getSerie("fome_penssan_pessoas").nota}</span>
                </div>
              )}
            </>
          }
        />
      </div>

      <section aria-labelledby="h-mapa-fome" className="flex flex-wrap border-2 border-accent">
        <div className="flex min-w-0 flex-[1_1_320px] flex-col justify-center gap-2 p-5">
          <h3 id="h-mapa-fome" className="font-display text-[clamp(26px,3vw,34px)] leading-none uppercase">
            Brasil no Mapa da Fome da ONU?
          </h3>
          <p className="text-sm text-muted">
            Um país entra no Mapa da Fome quando mais de 2,5% da população está subalimentada (FAO).
          </p>
          <Fonte url={mapa.serie.url}>
            <span className="font-mono text-[11px]">FONTE: {mapa.serie.fonte.toUpperCase()}</span>
          </Fonte>
        </div>
        {(["inicio", "fim"] as const).map((lado) => {
          const p = mapa[lado];
          const dentro = p ? noMapaDaFome(p) : undefined;
          return (
            <div
              key={lado}
              className={`flex flex-[0_1_220px] flex-col justify-center gap-1.5 border-l border-line p-5 ${
                dentro ? "bg-accent text-ink" : ""
              }`}
            >
              <span className="text-xs font-bold uppercase">{lado === "inicio" ? "Na posse" : "No fim"}</span>
              <span className="font-display text-[52px] leading-[0.9]">
                {dentro === undefined ? "—" : dentro ? "Sim" : "Não"}
              </span>
              <span className="font-mono text-[11px]">
                {p
                  ? `${p.valor > 2.5 ? formatar(p.valor, "pct", 1) : "≤ 2,5%"} · ${rotuloPeriodo(p)}`
                  : "sem dado da FAO"}
              </span>
            </div>
          );
        })}
      </section>

      <TabelaComparacao
        legenda="Outros indicadores sociais na posse e no fim do mandato"
        linhas={indicadoresTabela.map((ind) => comparar(ind, m))}
      />

      <NotaMetodo data={atualizadoEm.raiox}>
        Pesquisas que não são anuais usam a medição mais próxima, com a data ao lado. &quot;Melhorou&quot; e
        &quot;piorou&quot; seguem a direção desejável de cada indicador.
      </NotaMetodo>
    </div>
  );
}
