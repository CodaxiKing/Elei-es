import economia from "@/data/economia/series.json";
import raiox from "@/data/raiox/series.json";
import type { Mandato } from "@/lib/mandatos";

export type Ponto = { periodo: string; fim: string; valor: number; rotulo?: string };
export type Serie = { fonte: string; url: string; unidade: string; nota?: string; pontos: Ponto[] };
export type Status = "melhorou" | "piorou" | "estavel" | "subiu" | "caiu" | "sem-dados";
export type Formato = "pct" | "decimal" | "milhoes" | "reais" | "km2" | "anos";

export type Indicador = {
  id: string;
  nome: string;
  /** Séries em ordem de preferência; usa a primeira que tiver valor na posse e no fim. */
  series: string[];
  /** "neutra" para indicadores sem direção desejável clara (juros, câmbio): só diz se subiu ou caiu. */
  direcao: "menor-melhor" | "maior-melhor" | "neutra";
  /** Variação abaixo disso conta como estável. */
  tolerancia: number;
  toleranciaRelativa?: boolean;
  /** Preços: a situação é julgada pela variação descontada a inflação (IPCA) do período. */
  corrigirInflacao?: boolean;
  formato: Formato;
  casas: number;
  /** Quão antiga pode ser a medição usada como "na posse" (pesquisas que não são anuais). */
  maxDefasagemAnos?: number;
};

export type Comparacao = {
  indicador: Indicador;
  serieId?: string;
  serie?: Serie;
  inicio?: Ponto;
  fim?: Ponto;
  delta?: number;
  /** Variação descontada a inflação, em fração (0,1 = +10%). Só em indicadores com corrigirInflacao. */
  variacaoReal?: number;
  status: Status;
};

const series = { ...raiox.series, ...economia.series } as Record<string, Serie>;
export const atualizadoEm = { raiox: raiox.geradoEm, economia: economia.geradoEm };

export function getSerie(id: string): Serie {
  const s = series[id];
  if (!s) throw new Error(`Série desconhecida: ${id}`);
  return s;
}

const DIA = 24 * 60 * 60 * 1000;

/**
 * Valor na posse = última medição encerrada antes da posse (e não mais antiga que o limite).
 * Valor no fim = última medição encerrada até o fim do mandato, desde que medida depois da posse.
 */
export function escolherPontos(
  pontos: Ponto[],
  posse: string,
  fimMandato: string,
  maxDefasagemAnos = 1.5,
): { inicio?: Ponto; fim?: Ponto } {
  const ordenados = [...pontos].sort((a, b) => a.fim.localeCompare(b.fim));
  const limite = new Date(posse).getTime() - maxDefasagemAnos * 365.25 * DIA;
  const inicio = ordenados.filter((p) => p.fim < posse && new Date(p.fim).getTime() >= limite).at(-1);
  const fim = ordenados.filter((p) => p.fim > posse && p.fim <= fimMandato).at(-1);
  return { inicio, fim };
}

/** IPCA acumulado entre o mês de `de` e o mês de `ate`, em fração (0,1 = 10%). */
export function inflacaoEntre(de: Ponto, ate: Ponto): number | undefined {
  const indice = new Map(getSerie("ipca_indice").pontos.map((p) => [p.periodo, p.valor]));
  const a = indice.get(de.fim.slice(0, 7));
  const b = indice.get(ate.fim.slice(0, 7));
  return a && b ? b / a - 1 : undefined;
}

export function classificar(ind: Indicador, inicio: number, fim: number, variacaoReal?: number): { delta: number; status: Status } {
  const delta = fim - inicio;
  let mudanca: number;
  if (ind.corrigirInflacao && variacaoReal !== undefined) mudanca = variacaoReal;
  else if (ind.toleranciaRelativa) mudanca = delta / inicio;
  else mudanca = delta;
  if (Math.abs(mudanca) <= ind.tolerancia) return { delta, status: "estavel" };
  const caiu = mudanca < 0;
  if (ind.direcao === "neutra") return { delta, status: caiu ? "caiu" : "subiu" };
  const melhorou = ind.direcao === "menor-melhor" ? caiu : !caiu;
  return { delta, status: melhorou ? "melhorou" : "piorou" };
}

export function comparar(ind: Indicador, m: Mandato): Comparacao {
  for (const serieId of ind.series) {
    const serie = getSerie(serieId);
    const { inicio, fim } = escolherPontos(serie.pontos, m.inicio, m.fim, ind.maxDefasagemAnos);
    if (!inicio || !fim) continue;
    let variacaoReal: number | undefined;
    if (ind.corrigirInflacao) {
      const inflacao = inflacaoEntre(inicio, fim);
      if (inflacao !== undefined) variacaoReal = fim.valor / inicio.valor / (1 + inflacao) - 1;
    }
    return { indicador: ind, serieId, serie, inicio, fim, variacaoReal, ...classificar(ind, inicio.valor, fim.valor, variacaoReal) };
  }
  return { indicador: ind, status: "sem-dados" };
}

/** Medições de uma série feitas durante o mandato (para pesquisas esparsas). */
export function medicoesNoMandato(serieId: string, m: Mandato): Ponto[] {
  return getSerie(serieId).pontos.filter((p) => p.fim > m.inicio && p.fim <= m.fim);
}

/**
 * Soma uma série de variações mensais (%) nos meses do mandato.
 * Ex.: inflação acumulada do mês da posse até o último mês do mandato com dado.
 */
export function acumuladoNoMandato(serieId: string, m: Mandato): { valor: number; de: Ponto; ate: Ponto } | undefined {
  const meses = medicoesNoMandato(serieId, m);
  if (meses.length === 0) return undefined;
  const fator = meses.reduce((f, p) => f * (1 + p.valor / 100), 1);
  return { valor: (fator - 1) * 100, de: meses[0], ate: meses[meses.length - 1] };
}

// ---------- Formatação ----------

export function formatar(valor: number, formato: Formato, casas: number): string {
  const n = valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
  switch (formato) {
    case "pct":
      return `${n}%`;
    case "milhoes":
      return `${n} mi`;
    case "reais":
      return `R$ ${n}`;
    case "km2":
      return `${n} km²`;
    case "anos":
      return `${n} anos`;
    default:
      return n;
  }
}

/** "+12,3%" a partir de uma fração. */
export function formatarFracao(fracao: number): string {
  const sinal = fracao > 0 ? "+" : fracao < 0 ? "−" : "";
  return `${sinal}${Math.abs(fracao * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

export function formatarDelta(c: Comparacao): string {
  if (c.delta === undefined || !c.inicio) return "—";
  const { formato, casas, toleranciaRelativa, corrigirInflacao } = c.indicador;
  if (toleranciaRelativa || corrigirInflacao) return formatarFracao(c.delta / c.inicio.valor);
  const sinal = c.delta > 0 ? "+" : c.delta < 0 ? "−" : "";
  const abs = formatar(Math.abs(c.delta), formato === "pct" ? "decimal" : formato, casas);
  return `${sinal}${abs}${formato === "pct" ? " pp" : ""}`;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "dez/2018", "4º tri/2018", "2018" ou o rótulo da pesquisa. */
export function rotuloPeriodo(p: Ponto): string {
  if (p.rotulo) return p.rotulo;
  const tri = /^(\d{4})-T(\d)$/.exec(p.periodo);
  if (tri) return `${tri[2]}º tri/${tri[1]}`;
  const mes = /^(\d{4})-(\d{2})$/.exec(p.periodo);
  if (mes) return `${MESES[Number(mes[2]) - 1]}/${mes[1]}`;
  return p.periodo;
}
