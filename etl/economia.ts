/**
 * Baixa preços (cesta básica, combustíveis), inflação e dívida pública das fontes oficiais
 * e grava em data/economia/series.json.
 *
 *   npm run etl:economia
 */
import { join } from "node:path";
import readXlsxFile from "read-excel-file/node";
import {
  RAIZ,
  arred,
  getBuffer,
  gravar,
  ipeaMensal,
  ipeaUrl,
  mensal,
  ordenar,
  sgs,
  sgsUrl,
  sidra,
  type Ponto,
  type Serie,
} from "./fontes.ts";

const SAIDA = join(RAIZ, "data", "economia", "series.json");

const ANP_PAGINA =
  "https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis/serie-historica-do-levantamento-de-precos";
const ANP_BASE =
  "https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis/shlp";
const ANP_ARQUIVOS = [`${ANP_BASE}/2001-2012/mensal-brasil-2001-a-2012.xlsx`, `${ANP_BASE}/mensal/mensal-brasil-desde-jan2013.xlsx`];

/** Nome do produto na planilha da ANP (sem acento, maiúsculo) → id da série. */
const PRODUTOS_ANP: Record<string, { id: string; unidade: string }> = {
  "GASOLINA COMUM": { id: "gasolina", unidade: "R$ por litro" },
  "ETANOL HIDRATADO": { id: "etanol", unidade: "R$ por litro" },
  "OLEO DIESEL": { id: "diesel", unidade: "R$ por litro" },
  GLP: { id: "gas_cozinha", unidade: "R$ por botijão de 13 kg" },
};

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();

/** Preço médio de revenda (bomba) no Brasil, mês a mês, das planilhas oficiais da ANP. */
async function combustiveis(): Promise<Record<string, Serie>> {
  const pontos: Record<string, Ponto[]> = {};
  for (const url of ANP_ARQUIVOS) {
    const linhas = await readXlsxFile(await getBuffer(url));
    const cabecalho = linhas.findIndex((l) => typeof l[1] === "string" && semAcento(l[1]) === "PRODUTO");
    if (cabecalho < 0) throw new Error(`Cabeçalho não encontrado em ${url}`);
    const colPreco = linhas[cabecalho].findIndex((c) => typeof c === "string" && semAcento(c) === "PRECO MEDIO REVENDA");
    for (const l of linhas.slice(cabecalho + 1)) {
      const [mes, produto] = l;
      const p = typeof produto === "string" ? PRODUTOS_ANP[semAcento(produto)] : undefined;
      if (!p || !(mes instanceof Date) || typeof l[colPreco] !== "number") continue;
      (pontos[p.id] ??= []).push(mensal(mes.getUTCFullYear(), mes.getUTCMonth() + 1, arred(l[colPreco] as number, 3)));
    }
  }
  return Object.fromEntries(
    Object.values(PRODUTOS_ANP).map(({ id, unidade }) => [
      id,
      {
        fonte: "ANP — Levantamento de Preços de Combustíveis (preço médio de revenda, Brasil)",
        url: ANP_PAGINA,
        unidade,
        nota: id === "diesel" ? "Óleo diesel comum (S500)" : undefined,
        pontos: ordenar(pontos[id] ?? []),
      },
    ]),
  );
}

/** Soma ponto a ponto duas séries mensais (só nos meses presentes nas duas). */
function somar(a: Ponto[], b: Ponto[]): Ponto[] {
  const mb = new Map(b.map((p) => [p.periodo, p.valor]));
  return a.filter((p) => mb.has(p.periodo)).map((p) => ({ ...p, valor: arred(p.valor + (mb.get(p.periodo) as number), 2) }));
}

/** Divide ponto a ponto (em %), só nos meses presentes nas duas séries. */
function percentual(a: Ponto[], b: Ponto[]): Ponto[] {
  const mb = new Map(b.map((p) => [p.periodo, p.valor]));
  return a
    .filter((p) => mb.has(p.periodo) && (mb.get(p.periodo) as number) > 0)
    .map((p) => ({ ...p, valor: arred((p.valor / (mb.get(p.periodo) as number)) * 100, 1) }));
}

/** Baixa uma série e anuncia no console: as consultas demoram e o script fica mudo sem isso. */
async function p<T>(rotulo: string, fazer: () => Promise<T>): Promise<T> {
  console.log(`→ ${rotulo}`);
  return fazer();
}

async function main() {
  const ipcaIndice = await p("IPCA (IBGE/SIDRA)", () => sidra("t/1737/n1/all/v/2266/p/all"));
  const cesta = await p("cesta básica (DIEESE/Ipeadata)", () =>
    ipeaMensal("DIEESE12_CBSP12").then((pts) => pts.filter((pt) => pt.fim >= "1994-07-01")),
  );
  const salarioMinimo = await p("salário mínimo (SGS 1619)", () => sgs(1619));

  const series: Record<string, Serie> = {
    ipca_indice: {
      fonte: "IBGE — IPCA, número-índice (dez/1993 = 100)",
      url: "https://sidra.ibge.gov.br/tabela/1737",
      unidade: "índice",
      nota: "Usado para corrigir os preços pela inflação",
      pontos: ipcaIndice.map((l) => mensal(Number(l.D3C.slice(0, 4)), Number(l.D3C.slice(4)), Number(l.V))),
    },
    ipca_mensal: {
      fonte: "IBGE — IPCA, variação mensal (via Banco Central, SGS 433)",
      url: sgsUrl(433),
      unidade: "% ao mês",
      pontos: await p("IPCA mensal (SGS 433)", () => sgs(433)),
    },
    ipca_alimentos_mensal: {
      fonte: "IBGE — IPCA Alimentação e bebidas, variação mensal (via Banco Central, SGS 1635)",
      url: sgsUrl(1635),
      unidade: "% ao mês",
      pontos: await p("IPCA de alimentação (SGS 1635)", () => sgs(1635)),
    },
    cesta_basica_sp: {
      fonte: "DIEESE — Pesquisa Nacional da Cesta Básica, São Paulo (via Ipeadata)",
      url: ipeaUrl("DIEESE12_CBSP12"),
      unidade: "R$ por mês, cesta para 1 adulto",
      nota: "São Paulo é a capital com a série mais longa",
      pontos: cesta,
    },
    salario_minimo: {
      fonte: "Salário mínimo nominal (via Banco Central, SGS 1619)",
      url: sgsUrl(1619),
      unidade: "R$",
      pontos: salarioMinimo,
    },
    cesta_pct_salario_minimo: {
      fonte: "DIEESE (cesta de São Paulo) ÷ salário mínimo bruto",
      url: ipeaUrl("DIEESE12_CBSP12"),
      unidade: "% do salário mínimo",
      nota: "Calculado sobre o salário mínimo bruto do mês",
      pontos: percentual(cesta, salarioMinimo),
    },
    ...(await p("combustíveis (ANP)", combustiveis)),
    divida_bruta: {
      fonte: "Banco Central — Dívida Bruta do Governo Geral (SGS 13762)",
      url: sgsUrl(13762),
      unidade: "% do PIB",
      pontos: await p("dívida bruta (SGS 13762)", () => sgs(13762, 2006)),
    },
    divida_bruta_antiga: {
      fonte: "Banco Central — Dívida Bruta do Governo Geral, metodologia até 2007 (SGS 4537)",
      url: sgsUrl(4537),
      unidade: "% do PIB",
      nota: "Metodologia anterior, que inclui títulos na carteira do Banco Central; não é comparável com a atual",
      pontos: await p("dívida bruta antiga (SGS 4537)", () => sgs(4537, 2001)),
    },
    divida_liquida: {
      fonte: "Banco Central — Dívida Líquida do Setor Público, interna + externa (via Ipeadata)",
      url: ipeaUrl("BM12_DINSPY12"),
      unidade: "% do PIB",
      pontos: await p("dívida líquida (Ipeadata)", async () =>
        somar(await ipeaMensal("BM12_DINSPY12"), await ipeaMensal("BM12_DEXSPY12")),
      ),
    },
    selic: {
      fonte: "Banco Central — Selic acumulada no mês, anualizada (SGS 4189)",
      url: sgsUrl(4189),
      unidade: "% ao ano",
      pontos: await p("Selic (SGS 4189)", () => sgs(4189)),
    },
    dolar: {
      fonte: "Banco Central — dólar comercial (PTAX), média mensal de venda (SGS 3698)",
      url: sgsUrl(3698),
      unidade: "R$ por US$",
      pontos: await p("dólar (SGS 3698)", async () => (await sgs(3698)).filter((pt) => pt.fim >= "1994-07-01")),
    },
  };

  await gravar(SAIDA, series);
}

await main();
