/**
 * Baixa as séries do Raio-X social das fontes oficiais e grava em data/raiox/series.json.
 *
 *   npm run etl:raiox
 *
 * Cada série guarda pontos { periodo, fim, valor }, onde `fim` é o último dia do período
 * medido. É a partir dele que lib/raiox.ts escolhe o valor da posse e do fim de cada mandato.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type Ponto = { periodo: string; fim: string; valor: number; rotulo?: string };
type Serie = {
  fonte: string;
  url: string;
  unidade: string;
  /** Nota curta exibida junto ao valor (ex.: cobertura, metodologia). */
  nota?: string;
  pontos: Ponto[];
};

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SAIDA = join(RAIZ, "data", "raiox", "series.json");
const MANUAL = join(RAIZ, "data", "raiox", "manual.json");
const UA = { "User-Agent": "ObservatorioPresidencia/0.1 (+dados abertos)" };

async function getJson<T>(url: string): Promise<T> {
  for (let tentativa = 1; ; tentativa++) {
    try {
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(120_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (erro) {
      if (tentativa >= 3) throw new Error(`Falha ao baixar ${url}: ${String(erro)}`);
      await new Promise((r) => setTimeout(r, 2000 * tentativa));
    }
  }
}

const ultimoDia = (ano: number, mes: number) => {
  const d = new Date(Date.UTC(ano, mes, 0));
  return d.toISOString().slice(0, 10);
};
const mensal = (ano: number, mes: number, valor: number): Ponto => ({
  periodo: `${ano}-${String(mes).padStart(2, "0")}`,
  fim: ultimoDia(ano, mes),
  valor,
});
const trimestral = (ano: number, tri: number, valor: number): Ponto => ({
  periodo: `${ano}-T${tri}`,
  fim: ultimoDia(ano, tri * 3),
  valor,
});
const anual = (ano: number, valor: number, rotulo?: string): Ponto => ({
  periodo: String(ano),
  fim: `${ano}-12-31`,
  valor,
  ...(rotulo ? { rotulo } : {}),
});
const arred = (v: number, casas = 2) => Math.round(v * 10 ** casas) / 10 ** casas;

// ---------- Fontes ----------

type IpeaValor = { VALDATA: string; VALVALOR: number | null; NIVNOME?: string; TERCODIGO?: string };

/** Ipeadata. Em séries com recorte territorial, fica só com o nível Brasil. */
async function ipeadata(codigo: string): Promise<IpeaValor[]> {
  const url = `http://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='${codigo}')`;
  const { value } = await getJson<{ value: IpeaValor[] }>(url);
  const temNiveis = value.some((v) => v.NIVNOME);
  return value.filter((v) => v.VALVALOR !== null && (!temNiveis || v.NIVNOME === "Brasil"));
}
const ipeaUrl = (codigo: string) => `http://www.ipeadata.gov.br/ExibeSerie.aspx?serid=${codigo}`;
const dataIpea = (v: IpeaValor) => ({ ano: Number(v.VALDATA.slice(0, 4)), mes: Number(v.VALDATA.slice(5, 7)) });

/** Banco Central — SGS. */
async function sgs(codigo: number, inicio: string, fimData: string): Promise<Ponto[]> {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados?formato=json&dataInicial=${inicio}&dataFinal=${fimData}`;
  const dados = await getJson<{ data: string; valor: string }[]>(url);
  return dados.map((d) => {
    const [, mes, ano] = d.data.split("/").map(Number);
    return mensal(ano, mes, Number(d.valor));
  });
}

/** Banco Mundial (dados da ONU/FAO/OMS republicados). */
async function bancoMundial(indicador: string): Promise<Ponto[]> {
  const url = `https://api.worldbank.org/v2/country/BRA/indicator/${indicador}?format=json&per_page=200`;
  const [, linhas] = await getJson<[unknown, { date: string; value: number | null }[]]>(url);
  return linhas
    .filter((l) => l.value !== null)
    .map((l) => anual(Number(l.date), l.value as number))
    .sort((a, b) => a.fim.localeCompare(b.fim));
}

/** IBGE — SIDRA. Devolve as linhas de dados (sem o cabeçalho). */
async function sidra(caminho: string): Promise<Record<string, string>[]> {
  const linhas = await getJson<Record<string, string>[]>(`https://apisidra.ibge.gov.br/values/${caminho}`);
  return linhas.slice(1);
}

// ---------- Indicadores ----------

async function desemprego(): Promise<Record<string, Serie>> {
  const pnadc = await sidra("t/4099/n1/all/v/4099/p/all");
  const desocupados = await ipeadata("PNADCT_P14MDSCPUF");
  const pmeNova = await ipeadata("PAN12_TD12");
  const pmeAntiga = await ipeadata("PME12_TDA12");
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
      pontos: desocupados.map((v) => {
        const { ano, mes } = dataIpea(v);
        return trimestral(ano, Math.ceil(mes / 3), v.VALVALOR as number);
      }),
    },
    desemprego_pme: {
      fonte: "IBGE — PME (via Ipeadata)",
      url: ipeaUrl("PAN12_TD12"),
      unidade: "%",
      nota: "Só 6 regiões metropolitanas; não é comparável com a PNAD Contínua",
      pontos: pmeNova.map((v) => {
        const { ano, mes } = dataIpea(v);
        return mensal(ano, mes, v.VALVALOR as number);
      }),
    },
    desemprego_pme_antiga: {
      fonte: "IBGE — PME, metodologia antiga (via Ipeadata)",
      url: ipeaUrl("PME12_TDA12"),
      unidade: "%",
      nota: "Metodologia anterior a 2002, só regiões metropolitanas; não é comparável com as séries seguintes",
      pontos: pmeAntiga.map((v) => {
        const { ano, mes } = dataIpea(v);
        return mensal(ano, mes, v.VALVALOR as number);
      }),
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
        .map((p) => ({ ...p, valor: arred((p.valor / 100) * (pop.get(p.periodo) as number) / 1e6, 1) })),
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

async function anualIpea(codigo: string, escala = 1): Promise<Ponto[]> {
  return (await ipeadata(codigo))
    .map((v) => anual(dataIpea(v).ano, arred((v.VALVALOR as number) * escala, 4)))
    .sort((a, b) => a.fim.localeCompare(b.fim));
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
      pontos: await anualIpea("PNADS_PERCPOBRE300"),
    },
    gini: {
      fonte: "IPEA, a partir da PNAD e da PNAD Contínua (IBGE)",
      url: ipeaUrl("PNADS_GINI"),
      unidade: "índice de 0 a 1",
      pontos: await anualIpea("PNADS_GINI", 0.01),
    },
    renda_trabalho: {
      fonte: "IBGE — PNAD Contínua (via Ipeadata)",
      url: ipeaUrl("PNADCT_RRHPUF"),
      unidade: "R$ por mês, valores reais",
      nota: "Rendimento médio real habitual do trabalho principal",
      pontos: (await ipeadata("PNADCT_RRHPUF")).map((v) => {
        const { ano, mes } = dataIpea(v);
        return trimestral(ano, Math.ceil(mes / 3), v.VALVALOR as number);
      }),
    },
    salario_minimo_real: {
      fonte: "IPEA — salário mínimo real",
      url: ipeaUrl("GAC12_SALMINRE12"),
      unidade: "R$, valores reais",
      pontos: (await ipeadata("GAC12_SALMINRE12"))
        .map((v) => {
          const { ano, mes } = dataIpea(v);
          return mensal(ano, mes, arred(v.VALVALOR as number));
        })
        .filter((p) => p.fim >= "1990-01-01"),
    },
    inflacao_12m: {
      fonte: "IBGE — IPCA acumulado em 12 meses (via Banco Central, SGS 13522)",
      url: "https://www3.bcb.gov.br/sgspub/consultarvalores/telaCvsSelecionarSeries.paint?codigoSerie=13522",
      unidade: "%",
      pontos: await sgs(13522, "01/01/1994", "31/12/2030"),
    },
    homicidios: {
      fonte: "Atlas da Violência (IPEA/FBSP), a partir do SIM/DataSUS",
      url: ipeaUrl("AVIOL12_THOMIC"),
      unidade: "por 100 mil habitantes",
      nota: "Dados chegam com cerca de 2 anos de atraso",
      pontos: await anualIpea("AVIOL12_THOMIC"),
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
      pontos: (await ipeadata("PNADCT_TXINFORMUF")).map((v) => {
        const { ano, mes } = dataIpea(v);
        return trimestral(ano, Math.ceil(mes / 3), v.VALVALOR as number);
      }),
    },
  };

  // Séries curadas à mão (pesquisas sem API), mantidas em data/raiox/manual.json.
  const manual = JSON.parse(await readFile(MANUAL, "utf-8")) as Record<string, Serie>;
  Object.assign(series, manual);

  for (const [id, s] of Object.entries(series)) {
    const vistos = new Set<string>();
    s.pontos = s.pontos.filter((p) => !vistos.has(p.periodo) && vistos.add(p.periodo));
    if (s.pontos.length === 0) throw new Error(`Série vazia: ${id}`);
    const ultimo = s.pontos.at(-1) as Ponto;
    console.log(`${id.padEnd(24)} ${String(s.pontos.length).padStart(4)} pontos  ${s.pontos[0].periodo} → ${ultimo.periodo} = ${ultimo.valor}`);
  }

  await mkdir(dirname(SAIDA), { recursive: true });
  await writeFile(SAIDA, JSON.stringify({ geradoEm: new Date().toISOString(), series }, null, 1) + "\n");
  console.log(`\nGravado em ${SAIDA}`);
}

await main();
