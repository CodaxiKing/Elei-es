import dados from "@/data/raiox/series.json";
import type { Mandato } from "@/lib/mandatos";

export type Ponto = { periodo: string; fim: string; valor: number; rotulo?: string };
export type Serie = { fonte: string; url: string; unidade: string; nota?: string; pontos: Ponto[] };
export type Status = "melhorou" | "piorou" | "estavel" | "sem-dados";
export type Formato = "pct" | "decimal" | "milhoes" | "reais" | "km2" | "anos";

export type Indicador = {
  id: string;
  nome: string;
  /** Séries em ordem de preferência; usa a primeira que tiver valor na posse e no fim. */
  series: string[];
  direcao: "menor-melhor" | "maior-melhor";
  /** Variação abaixo disso conta como estável. */
  tolerancia: number;
  toleranciaRelativa?: boolean;
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
  status: Status;
};

const series = dados.series as Record<string, Serie>;
export const atualizadoEm: string = dados.geradoEm;

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

export function classificar(ind: Indicador, inicio: number, fim: number): { delta: number; status: Status } {
  const delta = fim - inicio;
  const comparavel = ind.toleranciaRelativa ? Math.abs(delta / inicio) : Math.abs(delta);
  if (comparavel <= ind.tolerancia) return { delta, status: "estavel" };
  const caiu = delta < 0;
  const melhorou = ind.direcao === "menor-melhor" ? caiu : !caiu;
  return { delta, status: melhorou ? "melhorou" : "piorou" };
}

export function comparar(ind: Indicador, m: Mandato): Comparacao {
  for (const serieId of ind.series) {
    const serie = getSerie(serieId);
    const { inicio, fim } = escolherPontos(serie.pontos, m.inicio, m.fim, ind.maxDefasagemAnos);
    if (inicio && fim) {
      return { indicador: ind, serieId, serie, inicio, fim, ...classificar(ind, inicio.valor, fim.valor) };
    }
  }
  return { indicador: ind, status: "sem-dados" };
}

// ---------- Indicadores ----------

export const desemprego: Indicador = {
  id: "desemprego",
  nome: "Desemprego",
  series: ["desemprego_pnadc", "desemprego_pme", "desemprego_pme_antiga"],
  direcao: "menor-melhor",
  tolerancia: 0.3,
  formato: "pct",
  casas: 1,
};

export const fome: Indicador = {
  id: "fome",
  nome: "Fome",
  series: ["fome_ibge_pessoas"],
  direcao: "menor-melhor",
  tolerancia: 0.05,
  toleranciaRelativa: true,
  formato: "milhoes",
  casas: 1,
  maxDefasagemAnos: 6,
};

export const indicadoresTabela: Indicador[] = [
  { id: "pobreza", nome: "Extrema pobreza", series: ["pobreza_extrema"], direcao: "menor-melhor", tolerancia: 0.3, formato: "pct", casas: 1, maxDefasagemAnos: 2.5 },
  { id: "gini", nome: "Desigualdade (Gini)", series: ["gini"], direcao: "menor-melhor", tolerancia: 0.005, formato: "decimal", casas: 3, maxDefasagemAnos: 2.5 },
  { id: "renda", nome: "Renda média do trabalho", series: ["renda_trabalho"], direcao: "maior-melhor", tolerancia: 0.02, toleranciaRelativa: true, formato: "reais", casas: 0 },
  { id: "salario-minimo", nome: "Salário mínimo real", series: ["salario_minimo_real"], direcao: "maior-melhor", tolerancia: 0.02, toleranciaRelativa: true, formato: "reais", casas: 0 },
  { id: "inflacao", nome: "Inflação em 12 meses", series: ["inflacao_12m"], direcao: "menor-melhor", tolerancia: 0.5, formato: "pct", casas: 1 },
  { id: "homicidios", nome: "Homicídios", series: ["homicidios"], direcao: "menor-melhor", tolerancia: 0.5, formato: "decimal", casas: 1 },
  { id: "mortalidade-infantil", nome: "Mortalidade infantil", series: ["mortalidade_infantil"], direcao: "menor-melhor", tolerancia: 0.3, formato: "decimal", casas: 1 },
  { id: "expectativa-vida", nome: "Expectativa de vida", series: ["expectativa_vida"], direcao: "maior-melhor", tolerancia: 0.2, formato: "anos", casas: 1 },
  { id: "desmatamento", nome: "Desmatamento na Amazônia", series: ["desmatamento"], direcao: "menor-melhor", tolerancia: 0.05, toleranciaRelativa: true, formato: "km2", casas: 0 },
  { id: "informalidade", nome: "Informalidade", series: ["informalidade"], direcao: "menor-melhor", tolerancia: 0.5, formato: "pct", casas: 1 },
];

/** Limite da FAO: acima de 2,5% de subalimentados, o país está no Mapa da Fome. */
export const LIMITE_MAPA_DA_FOME = 2.5;

export function mapaDaFome(m: Mandato): { inicio?: Ponto; fim?: Ponto; serie: Serie } {
  const serie = getSerie("mapa_fome");
  return { ...escolherPontos(serie.pontos, m.inicio, m.fim), serie };
}

export const noMapaDaFome = (p: Ponto) => p.valor > LIMITE_MAPA_DA_FOME;

/** Medições de uma série feitas durante o mandato (para pesquisas esparsas, como a da Rede PENSSAN). */
export function medicoesNoMandato(serieId: string, m: Mandato): Ponto[] {
  return getSerie(serieId).pontos.filter((p) => p.fim > m.inicio && p.fim <= m.fim);
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

export function formatarDelta(c: Comparacao): string {
  if (c.delta === undefined || !c.inicio) return "—";
  const { formato, casas, toleranciaRelativa } = c.indicador;
  const sinal = c.delta > 0 ? "+" : c.delta < 0 ? "−" : "";
  if (toleranciaRelativa) {
    const pct = Math.abs((c.delta / c.inicio.valor) * 100);
    return `${sinal}${pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  }
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
