import type { Mandato } from "@/lib/mandatos";
import {
  atualizadoEm,
  comparar,
  desemprego,
  escolherPontos,
  fome,
  formatar,
  formatarDelta,
  getSerie,
  indicadoresTabela,
  mapaDaFome,
  medicoesNoMandato,
  noMapaDaFome,
  rotuloPeriodo,
  type Comparacao,
  type Ponto,
  type Status,
} from "@/lib/raiox";

const estilos: Record<Status, { rotulo: string; fundo: string; texto: string }> = {
  melhorou: { rotulo: "Melhorou", fundo: "bg-down", texto: "text-down" },
  piorou: { rotulo: "Piorou", fundo: "bg-up", texto: "text-up" },
  estavel: { rotulo: "Estável", fundo: "bg-[#555555]", texto: "text-paper" },
  "sem-dados": { rotulo: "Sem dados", fundo: "bg-transparent", texto: "text-muted" },
};

function Selo({ status }: { status: Status }) {
  const e = estilos[status];
  const cor = status === "estavel" || status === "sem-dados" ? "text-paper" : "text-ink";
  const borda = status === "sem-dados" ? "border border-line-strong" : "";
  return (
    <span className={`inline-block px-2 py-1 font-mono text-[11px] font-bold uppercase ${e.fundo} ${cor} ${borda}`}>
      {e.rotulo}
    </span>
  );
}

function Fonte({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="text-dim underline-offset-2 hover:text-paper hover:underline">
      {children}
    </a>
  );
}

function Barra({ valor, maximo, cor }: { valor: number; maximo: number; cor: string }) {
  return (
    <div className="h-3.5 flex-1 bg-[#1a1a1a]">
      <div className={`h-full ${cor}`} style={{ width: `${Math.min(100, (valor / maximo) * 100)}%` }} />
    </div>
  );
}

function CartaoDestaque({
  titulo,
  unidade,
  c,
  extra,
  semDados,
}: {
  titulo: string;
  unidade: string;
  c: Comparacao;
  extra?: React.ReactNode;
  semDados?: React.ReactNode;
}) {
  const e = estilos[c.status];
  const { inicio, fim, indicador: ind } = c;
  const maximo = inicio && fim ? Math.max(inicio.valor, fim.valor) * 1.1 : 1;
  return (
    <article className="flex min-w-0 flex-[1_1_480px] flex-col border-2 border-paper bg-ink">
      <header className="flex items-center justify-between gap-3 border-b-2 border-paper px-5 py-4">
        <h3 className="font-display text-3xl uppercase">{titulo}</h3>
        <Selo status={c.status} />
      </header>
      {inicio && fim ? (
        <>
          <div className="grid grid-cols-2">
            <div className="flex flex-col gap-2 border-r border-line p-5">
              <span className="text-xs font-bold tracking-wider text-muted uppercase">Na posse · {rotuloPeriodo(inicio)}</span>
              <span className="font-display text-[clamp(44px,6vw,72px)] leading-[0.9] text-muted">
                {formatar(inicio.valor, ind.formato, ind.casas)}
              </span>
            </div>
            <div className="flex flex-col gap-2 p-5">
              <span className="text-xs font-bold tracking-wider text-muted uppercase">No fim · {rotuloPeriodo(fim)}</span>
              <span className={`font-display text-[clamp(44px,6vw,72px)] leading-[0.9] ${e.texto}`}>
                {formatar(fim.valor, ind.formato, ind.casas)}
              </span>
            </div>
          </div>
          <p className="px-5 text-[13px] text-muted">{unidade}</p>
          <div aria-hidden="true" className="flex flex-col gap-2 px-5 pt-3 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-16 font-mono text-[11px] text-muted">POSSE</span>
              <Barra valor={inicio.valor} maximo={maximo} cor="bg-[#555555]" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-16 font-mono text-[11px] text-muted">FIM</span>
              <Barra valor={fim.valor} maximo={maximo} cor={e.fundo} />
            </div>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pb-4">
            <span className={`font-display text-[26px] ${e.texto}`}>{formatarDelta(c)}</span>
            {extra}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3 p-5 text-muted">{semDados}</div>
      )}
      {c.serie && (
        <footer className="mt-auto flex flex-col gap-1 border-t border-line px-5 py-3 font-mono text-[11px]">
          <Fonte url={c.serie.url}>FONTE: {c.serie.fonte.toUpperCase()}</Fonte>
          {c.serie.nota && <span className="text-dim">{c.serie.nota}</span>}
        </footer>
      )}
    </article>
  );
}

function Medicoes({ pontos, formatarValor }: { pontos: Ponto[]; formatarValor: (p: Ponto) => string }) {
  return (
    <ul className="flex flex-col gap-1 font-mono text-sm">
      {pontos.map((p) => (
        <li key={p.periodo}>
          <span className="text-paper">{formatarValor(p)}</span> · {rotuloPeriodo(p)}
        </li>
      ))}
    </ul>
  );
}

export function RaioX({ m }: { m: Mandato }) {
  const cDesemprego = comparar(desemprego, m);
  const cFome = comparar(fome, m);
  const linhas = indicadoresTabela.map((ind) => comparar(ind, m));
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

  const dataAtualizacao = new Date(atualizadoEm).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

  return (
    <div className="flex flex-col gap-8">
      {m.emAndamento && (
        <p className="border-l-4 border-accent bg-surface px-4 py-3 text-sm text-muted">
          Mandato em andamento: o valor &quot;no fim&quot; é o último dado publicado até agora.
        </p>
      )}

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

      <div className="overflow-x-auto border-2 border-paper">
        <table className="w-full min-w-[860px] border-collapse text-[15px]">
          <caption className="sr-only">Outros indicadores na posse e no fim do mandato</caption>
          <thead>
            <tr className="bg-paper text-left text-xs tracking-wider text-ink uppercase">
              <th scope="col" className="px-4 py-3">Indicador</th>
              <th scope="col" className="px-4 py-3 text-right">Na posse</th>
              <th scope="col" className="px-4 py-3 text-right">No fim</th>
              <th scope="col" className="px-4 py-3 text-right">Variação</th>
              <th scope="col" className="px-4 py-3">Situação</th>
              <th scope="col" className="px-4 py-3">Fonte</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((c) => {
              const ind = c.indicador;
              const serie = c.serie ?? getSerie(ind.series[0]);
              return (
                <tr key={ind.id} className="border-t border-line align-top">
                  <th scope="row" className="px-4 py-3.5 text-left font-bold">
                    {ind.nome}
                    <span className="block text-xs font-normal text-dim">{serie.unidade}</span>
                  </th>
                  <td className="px-4 py-3.5 text-right font-mono text-muted">
                    {c.inicio ? formatar(c.inicio.valor, ind.formato, ind.casas) : "—"}
                    {c.inicio && <span className="block text-[11px] text-dim">{rotuloPeriodo(c.inicio)}</span>}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold">
                    {c.fim ? formatar(c.fim.valor, ind.formato, ind.casas) : "—"}
                    {c.fim && <span className="block text-[11px] font-normal text-dim">{rotuloPeriodo(c.fim)}</span>}
                  </td>
                  <td className={`px-4 py-3.5 text-right font-mono ${estilos[c.status].texto}`}>{formatarDelta(c)}</td>
                  <td className="px-4 py-3.5">
                    <Selo status={c.status} />
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs">
                    <Fonte url={serie.url}>{serie.fonte}</Fonte>
                    {serie.nota && <span className="block text-dim">{serie.nota}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[13px] text-dim">
        &quot;Na posse&quot; é a última medição encerrada antes da posse; &quot;no fim&quot;, a última encerrada até o fim do
        mandato. Pesquisas que não são anuais usam a medição mais próxima, com a data ao lado. &quot;Melhorou&quot; e
        &quot;piorou&quot; seguem a direção desejável de cada indicador. Dados coletados em {dataAtualizacao}.
      </p>
    </div>
  );
}
