import type { Indicador } from "@/lib/indicadores";

const preco = (id: string, nome: string, serie: string): Indicador => ({
  id,
  nome,
  series: [serie],
  direcao: "menor-melhor",
  corrigirInflacao: true,
  tolerancia: 0.02,
  formato: "reais",
  casas: 2,
});

export const cestaBasica = preco("cesta", "Cesta básica", "cesta_basica_sp");

export const cestaNoSalario: Indicador = {
  id: "cesta-salario",
  nome: "Cesta no salário mínimo",
  series: ["cesta_pct_salario_minimo"],
  direcao: "menor-melhor",
  tolerancia: 1,
  formato: "pct",
  casas: 1,
};

export const gasolina = preco("gasolina", "Gasolina comum", "gasolina");

export const precosTabela: Indicador[] = [
  cestaBasica,
  gasolina,
  preco("etanol", "Etanol", "etanol"),
  preco("diesel", "Diesel", "diesel"),
  preco("gas", "Gás de cozinha", "gas_cozinha"),
];

export const dividaBruta: Indicador = {
  id: "divida-bruta",
  nome: "Dívida bruta",
  series: ["divida_bruta", "divida_bruta_antiga"],
  direcao: "menor-melhor",
  tolerancia: 1,
  formato: "pct",
  casas: 1,
};

export const dividaLiquida: Indicador = {
  id: "divida-liquida",
  nome: "Dívida líquida",
  series: ["divida_liquida"],
  direcao: "menor-melhor",
  tolerancia: 1,
  formato: "pct",
  casas: 1,
};

export const dividaTabela: Indicador[] = [
  dividaBruta,
  dividaLiquida,
  { id: "selic", nome: "Juros (Selic)", series: ["selic"], direcao: "neutra", tolerancia: 0.5, formato: "pct", casas: 2 },
  { id: "dolar", nome: "Dólar", series: ["dolar"], direcao: "neutra", tolerancia: 0.03, toleranciaRelativa: true, formato: "reais", casas: 2 },
];
