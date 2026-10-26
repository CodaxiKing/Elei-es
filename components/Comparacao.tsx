/** Peças visuais da comparação "na posse × no fim", usadas no Raio-X, em Preços e na Dívida. */
import {
  formatar,
  formatarDelta,
  formatarFracao,
  getSerie,
  rotuloPeriodo,
  type Comparacao,
  type Ponto,
  type Status,
} from "@/lib/indicadores";

export const estilos: Record<Status, { rotulo: string; fundo: string; texto: string }> = {
  melhorou: { rotulo: "Melhorou", fundo: "bg-down", texto: "text-down" },
  piorou: { rotulo: "Piorou", fundo: "bg-up", texto: "text-up" },
  estavel: { rotulo: "Estável", fundo: "bg-[#555555]", texto: "text-paper" },
  subiu: { rotulo: "Subiu ▲", fundo: "bg-[#555555]", texto: "text-paper" },
  caiu: { rotulo: "Caiu ▼", fundo: "bg-[#555555]", texto: "text-paper" },
  "sem-dados": { rotulo: "Sem dados", fundo: "bg-transparent", texto: "text-muted" },
};

export function Selo({ status }: { status: Status }) {
  const e = estilos[status];
  const cor = status === "melhorou" || status === "piorou" ? "text-ink" : "text-paper";
  const borda = status === "sem-dados" ? "border border-line-strong" : "";
  return (
    <span className={`inline-block px-2 py-1 font-mono text-[11px] font-bold whitespace-nowrap uppercase ${e.fundo} ${cor} ${borda}`}>
      {e.rotulo}
    </span>
  );
}

export function Fonte({ url, children }: { url: string; children: React.ReactNode }) {
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

export function CartaoDestaque({
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
              <span className="font-display text-[clamp(40px,5.5vw,72px)] leading-[0.9] text-muted">
                {formatar(inicio.valor, ind.formato, ind.casas)}
              </span>
            </div>
            <div className="flex flex-col gap-2 p-5">
              <span className="text-xs font-bold tracking-wider text-muted uppercase">No fim · {rotuloPeriodo(fim)}</span>
              <span className={`font-display text-[clamp(40px,5.5vw,72px)] leading-[0.9] ${e.texto}`}>
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
              <Barra valor={fim.valor} maximo={maximo} cor={e.fundo === "bg-transparent" ? "bg-paper" : e.fundo} />
            </div>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pb-4">
            <span className={`font-display text-[26px] ${e.texto}`}>{formatarDelta(c)}</span>
            {c.variacaoReal !== undefined && (
              <span className="font-mono text-xs text-muted">
                descontada a inflação: <span className={`font-bold ${e.texto}`}>{formatarFracao(c.variacaoReal)}</span>
              </span>
            )}
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

export function Medicoes({ pontos, formatarValor }: { pontos: Ponto[]; formatarValor: (p: Ponto) => string }) {
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

export function TabelaComparacao({
  linhas,
  legenda,
  mostrarReal = false,
}: {
  linhas: Comparacao[];
  legenda: string;
  mostrarReal?: boolean;
}) {
  return (
    <div className="overflow-x-auto border-2 border-paper">
      <table className="w-full min-w-[900px] border-collapse text-[15px]">
        <caption className="sr-only">{legenda}</caption>
        <thead>
          <tr className="bg-paper text-left text-xs tracking-wider text-ink uppercase">
            <th scope="col" className="px-4 py-3">Indicador</th>
            <th scope="col" className="px-4 py-3 text-right">Na posse</th>
            <th scope="col" className="px-4 py-3 text-right">No fim</th>
            <th scope="col" className="px-4 py-3 text-right">Variação</th>
            {mostrarReal && <th scope="col" className="px-4 py-3 text-right">Descontada a inflação</th>}
            <th scope="col" className="px-4 py-3">Situação</th>
            <th scope="col" className="px-4 py-3">Fonte</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((c) => {
            const ind = c.indicador;
            const serie = c.serie ?? getSerie(ind.series[0]);
            const corDelta = mostrarReal ? "text-muted" : estilos[c.status].texto;
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
                <td className={`px-4 py-3.5 text-right font-mono ${corDelta}`}>{formatarDelta(c)}</td>
                {mostrarReal && (
                  <td className={`px-4 py-3.5 text-right font-mono font-bold ${estilos[c.status].texto}`}>
                    {c.variacaoReal !== undefined ? formatarFracao(c.variacaoReal) : "—"}
                  </td>
                )}
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
  );
}

export function NotaMetodo({ data, children }: { data: string; children?: React.ReactNode }) {
  const dia = new Date(data).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return (
    <p className="text-[13px] text-dim">
      &quot;Na posse&quot; é a última medição encerrada antes da posse; &quot;no fim&quot;, a última encerrada até o fim do
      mandato. {children} Dados coletados em {dia}.
    </p>
  );
}

export function AvisoParcial() {
  return (
    <p className="border-l-4 border-accent bg-surface px-4 py-3 text-sm text-muted">
      Mandato em andamento: o valor &quot;no fim&quot; é o último dado publicado até agora.
    </p>
  );
}
