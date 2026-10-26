/**
 * Baixa as séries do Raio-X social das fontes oficiais e grava em data/raiox/series.json.
 *
 *   npm run etl:raiox
 *
 * Cada série guarda pontos { periodo, fim, valor }, onde `fim` é o último dia do período
 * medido. É a partir dele que lib/indicadores.ts escolhe o valor da posse e do fim de cada mandato.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  RAIZ,
  anual,
  arred,
  bancoMundial,
  getJson,
  gravar,
  ipeaAnual,
  ipeaMensal,
  ipeaTrimestral,
  ipeaUrl,
  sgs,
  sgsUrl,
  sidra,
  trimestral,
  type Ponto,
  type Serie,
} from "./fontes.ts";

const SAIDA = join(RAIZ, "data", "raiox", "series.json");
const MANUAL = join(RAIZ, "data", "raiox", "manual.json");

async function desemprego(): Promise<Record<string, Serie>> {
  const pnadc = await sidra("t/4099/n1/all/v/4099/p/all");
  return {
    desemprego_pnadc: {
      fonte: "IBGE — PNAD Contínua",
      url: "https://sidra.ibge.gov.br/tabela/4099",
      unidade: "%",
      pontos: pnadc.map((l) => trimestral(Number(l.D3C.slice(0, 4)), Number(l.D3C.slice(4)), Number(l.V))),
    },
    desocupados_pnadc: {
      fonte: "IBGE — PNAD Contínua (via Ipeadata)",
      url: ipeaUrl("PNADCT_P14MDSCPUF"),
      unidade: "mil pessoas",
      pontos: await ipeaTrimestral("PNADCT_P14MDSCPUF"),
    },
    desemprego_pme: {
      fonte: "IBGE — PME (via Ipeadata)",
      url: ipeaUrl("PAN12_TD12"),
      unidade: "%",
      nota: "Só 6 regiões metropolitanas; não é comparável com a PNAD Contínua",
      pontos: await ipeaMensal("PAN12_TD12", 2),
    },
    desemprego_pme_antiga: {
      fonte: "IBGE — PME, metodologia antiga (via Ipeadata)",
      url: ipeaUrl("PME12_TDA12"),
      unidade: "%",
      nota: "Metodologia anterior a 2002, só regiões metropolitanas; não é comparável com as séries seguintes",
      pontos: await ipeaMensal("PME12_TDA12", 3),
    },
  };
}

async function fome(populacao: Ponto[]): Promise<Record<string, Serie>> {
  const pct = await sidra("t/6665/n1/all/v/2133/p/all/c12404/109102");
  const pop = new Map(populacao.map((p) => [p.periodo, p.valor]));
  const rotulos: Record<string, string> = { "2004": "PNAD 2004", "2009": "PNAD 2009", "2013": "PNAD 2013", "2018": "POF 2017-2018" };
  const pontosPct = pct.map((l) => {
    const ano = Number(l.D3C);
    return anual(ano, Number(l.V), rotulos[l.D3C] ?? `PNAD Contínua ${ano}`);
  });
  return {
    fome_ibge_pct: {
      fonte: "IBGE — Escala Brasileira de Insegurança Alimentar (PNAD, POF, PNAD Contínua)",
      url: "https://sidra.ibge.gov.br/tabela/6665",
      unidade: "% dos moradores",
      nota: "Pesquisa feita só em alguns anos; vale a medição mais próxima, com a data indicada",
      pontos: pontosPct,
    },
    fome_ibge_pessoas: {
      fonte: "IBGE — % de moradores em insegurança alimentar grave × população (Banco Mundial)",
      url: "https://sidra.ibge.gov.br/tabela/6665",
      unidade: "milhões de pessoas",
      nota: "Estimativa: percentual do IBGE aplicado à população do ano",
      pontos: pontosPct
        .filter((p) => pop.has(p.periodo))
        .map((p) => ({ ...p, valor: arred(((p.valor / 100) * (pop.get(p.periodo) as number)) / 1e6, 1) })),
    },
  };
}

async function prodes(): Promise<Serie> {
  type Periodo = {
    startDate: { year: number };
    endDate: { year: number; month: number; day: number };
    features: { areas: { area: number }[] }[];
  };
  const url = "https://terrabrasilis.dpi.inpe.br/app/prodes/dashboard/deforestation/files/rates2026.json";
  const { periods } = await getJson<{ periods: Periodo[] }>(url);
  return {
    fonte: "INPE — PRODES (Amazônia Legal)",
    url: "https://terrabrasilis.dpi.inpe.br/app/dashboard/deforestation/biomes/legal_amazon/rates",
    unidade: "km² por ano",
    nota: "Ano PRODES vai de agosto a julho; o ano mais recente pode ser estimativa até a taxa consolidada sair",
    pontos: periods
      .map((p) => {
        const total = p.features.reduce((s, f) => s + f.areas.reduce((a, x) => a + x.area, 0), 0);
        const { year, month, day } = p.endDate;
        return {
          periodo: String(year),
          fim: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
          valor: Math.round(total),
          rotulo: `ago/${p.startDate.year}–jul/${year}`,
        };
      })
      .sort((a, b) => a.fim.localeCompare(b.fim)),
  };
}

async function main() {
  const populacao = await bancoMundial("SP.POP.TOTL");
  const subnutricao = await bancoMundial("SN.ITK.DEFC.ZS");

  const series: Record<string, Serie> = {
    ...(await desemprego()),
    ...(await fome(populacao)),
    mapa_fome: {
      fonte: "FAO — prevalência de subalimentação (via Banco Mundial)",
      url: "https://data.worldbank.org/indicator/SN.ITK.DEFC.ZS?locations=BR",
      unidade: "% da população",
      nota: "Média de 3 anos centrada no ano. A FAO publica valores abaixo de 2,5% como 2,5",
      pontos: subnutricao.map((p) => ({ ...p, rotulo: `média ${Number(p.periodo) - 1}–${Number(p.periodo) + 1}` })),
    },
    pobreza_extrema: {
      fonte: "IPEA, a partir da PNAD e da PNAD Contínua (IBGE)",
      url: ipeaUrl("PNADS_PERCPOBRE300"),
      unidade: "% da população",
      nota: "Abaixo de US$ 3,00 por dia (PPC 2021), linha de extrema pobreza do Banco Mundial",
      pontos: await ipeaAnual("PNADS_PERCPOBRE300"),
    },
    gini: {
      fonte: "IPEA, a partir da PNAD e da PNAD Contínua (IBGE)",
      url: ipeaUrl("PNADS_GINI"),
      unidade: "índice de 0 a 1",
      pontos: await ipeaAnual("PNADS_GINI", 0.01),
    },
    renda_trabalho: {
      fonte: "IBGE — PNAD Contínua (via Ipeadata)",
      url: ipeaUrl("PNADCT_RRHPUF"),
      unidade: "R$ por mês, valores reais",
      nota: "Rendimento médio real habitual do trabalho principal",
      pontos: await ipeaTrimestral("PNADCT_RRHPUF"),
    },
    salario_minimo_real: {
      fonte: "IPEA — salário mínimo real",
      url: ipeaUrl("GAC12_SALMINRE12"),
      unidade: "R$, valores reais",
      pontos: (await ipeaMensal("GAC12_SALMINRE12")).filter((p) => p.fim >= "1990-01-01"),
    },
    inflacao_12m: {
      fonte: "IBGE — IPCA acumulado em 12 meses (via Banco Central, SGS 13522)",
      url: sgsUrl(13522),
      unidade: "%",
      pontos: await sgs(13522),
    },
    homicidios: {
      fonte: "Atlas da Violência (IPEA/FBSP), a partir do SIM/DataSUS",
      url: ipeaUrl("AVIOL12_THOMIC"),
      unidade: "por 100 mil habitantes",
      nota: "Dados chegam com cerca de 2 anos de atraso",
      pontos: await ipeaAnual("AVIOL12_THOMIC"),
    },
    mortalidade_infantil: {
      fonte: "ONU (UN IGME), via Banco Mundial",
      url: "https://data.worldbank.org/indicator/SP.DYN.IMRT.IN?locations=BR",
      unidade: "mortes até 1 ano por mil nascidos vivos",
      pontos: await bancoMundial("SP.DYN.IMRT.IN"),
    },
    expectativa_vida: {
      fonte: "ONU (World Population Prospects), via Banco Mundial",
      url: "https://data.worldbank.org/indicator/SP.DYN.LE00.IN?locations=BR",
      unidade: "anos ao nascer",
      pontos: (await bancoMundial("SP.DYN.LE00.IN")).map((p) => ({ ...p, valor: arred(p.valor, 1) })),
    },
    desmatamento: await prodes(),
    informalidade: {
      fonte: "IBGE — PNAD Contínua (via Ipeadata)",
      url: ipeaUrl("PNADCT_TXINFORMUF"),
      unidade: "% dos ocupados",
      nota: "Série começa no fim de 2015",
      pontos: await ipeaTrimestral("PNADCT_TXINFORMUF"),
    },
  };

  // Séries curadas à mão (pesquisas sem API), mantidas em data/raiox/manual.json.
  Object.assign(series, JSON.parse(await readFile(MANUAL, "utf-8")) as Record<string, Serie>);

  await gravar(SAIDA, series);
}

await main();
