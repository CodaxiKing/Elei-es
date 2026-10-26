import { escolherPontos, getSerie, type Indicador, type Ponto, type Serie } from "@/lib/indicadores";
import type { Mandato } from "@/lib/mandatos";

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
