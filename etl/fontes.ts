/** Funções compartilhadas pelos coletores: acesso às APIs oficiais e formato dos pontos. */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type Ponto = { periodo: string; fim: string; valor: number; rotulo?: string };
export type Serie = {
  fonte: string;
  url: string;
  unidade: string;
  /** Nota curta exibida junto ao valor (ex.: cobertura, metodologia). */
  nota?: string;
  pontos: Ponto[];
};

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const UA = { "User-Agent": "ObservatorioPresidencia/0.1 (+dados abertos)" };

/** Baixa e interpreta a resposta, tentando de novo em erro de rede, HTTP ou resposta inválida. */
async function baixar<T>(url: string, ler: (res: Response) => Promise<T>): Promise<T> {
  for (let tentativa = 1; ; tentativa++) {
    try {
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(120_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await ler(res);
    } catch (erro) {
      if (tentativa >= 8) throw new Error(`Falha ao baixar ${url}: ${String(erro)}`);
      // Backoff exponencial com folga: o Banco Central costuma devolver erro só por throttling.
      const espera = Math.min(20_000, 1500 * 2 ** tentativa) + Math.random() * 1000;
      console.warn(
        `  ${new URL(url).host} falhou na tentativa ${tentativa}: ${String(erro).slice(0, 140)} ` +
          `(de novo em ${(espera / 1000).toFixed(0)}s)`,
      );
      await new Promise((r) => setTimeout(r, espera));
    }
  }
}

export async function getJson<T>(url: string): Promise<T> {
  return baixar(url, async (res) => {
    const texto = await res.text();
    // APIs públicas respondem 200 com página HTML/XML de erro quando bloqueiam a consulta.
    if (!/^\s*[\[{]/.test(texto)) throw new Error(`resposta não é JSON: ${texto.slice(0, 70).trim()}`);
    return JSON.parse(texto) as T;
  });
}

export async function getBuffer(url: string): Promise<Buffer> {
  return baixar(url, async (res) => Buffer.from(await res.arrayBuffer()));
}

const ultimoDia = (ano: number, mes: number) => new Date(Date.UTC(ano, mes, 0)).toISOString().slice(0, 10);

export const mensal = (ano: number, mes: number, valor: number): Ponto => ({
  periodo: `${ano}-${String(mes).padStart(2, "0")}`,
  fim: ultimoDia(ano, mes),
  valor,
});
export const trimestral = (ano: number, tri: number, valor: number): Ponto => ({
  periodo: `${ano}-T${tri}`,
  fim: ultimoDia(ano, tri * 3),
  valor,
});
export const anual = (ano: number, valor: number, rotulo?: string): Ponto => ({
  periodo: String(ano),
  fim: `${ano}-12-31`,
  valor,
  ...(rotulo ? { rotulo } : {}),
});
export const arred = (v: number, casas = 2) => Math.round(v * 10 ** casas) / 10 ** casas;
export const ordenar = (pontos: Ponto[]) => [...pontos].sort((a, b) => a.fim.localeCompare(b.fim));

// ---------- Ipeadata ----------

export type IpeaValor = { VALDATA: string; VALVALOR: number | null; NIVNOME?: string };

/** Em séries com recorte territorial, fica só com o nível Brasil. */
export async function ipeadata(codigo: string): Promise<IpeaValor[]> {
  const url = `http://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='${codigo}')`;
  const { value } = await getJson<{ value: IpeaValor[] }>(url);
  const temNiveis = value.some((v) => v.NIVNOME);
  return value.filter((v) => v.VALVALOR !== null && (!temNiveis || v.NIVNOME === "Brasil"));
}
export const ipeaUrl = (codigo: string) => `http://www.ipeadata.gov.br/ExibeSerie.aspx?serid=${codigo}`;
export const dataIpea = (v: IpeaValor) => ({ ano: Number(v.VALDATA.slice(0, 4)), mes: Number(v.VALDATA.slice(5, 7)) });

export async function ipeaMensal(codigo: string, casas = 2): Promise<Ponto[]> {
  return ordenar(
    (await ipeadata(codigo)).map((v) => {
      const { ano, mes } = dataIpea(v);
      return mensal(ano, mes, arred(v.VALVALOR as number, casas));
    }),
  );
}
export async function ipeaTrimestral(codigo: string): Promise<Ponto[]> {
  return ordenar(
    (await ipeadata(codigo)).map((v) => {
      const { ano, mes } = dataIpea(v);
      return trimestral(ano, Math.ceil(mes / 3), v.VALVALOR as number);
    }),
  );
}
export async function ipeaAnual(codigo: string, escala = 1): Promise<Ponto[]> {
  return ordenar((await ipeadata(codigo)).map((v) => anual(dataIpea(v).ano, arred((v.VALVALOR as number) * escala, 4))));
}

// ---------- Banco Central (SGS) ----------

export const sgsUrl = (codigo: number) =>
  `https://www3.bcb.gov.br/sgspub/consultarvalores/telaCvsSelecionarSeries.paint?codigoSerie=${codigo}`;

/** Série mensal do SGS. A API limita cada consulta a 10 anos, então busca em janelas. */
export async function sgs(codigo: number, anoInicio = 1994): Promise<Ponto[]> {
  const pontos: Ponto[] = [];
  const anoAtual = new Date().getUTCFullYear();
  for (let ano = anoInicio; ano <= anoAtual; ano += 10) {
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados?formato=json&dataInicial=01/01/${ano}&dataFinal=31/12/${Math.min(ano + 9, anoAtual)}`;
    const dados = await getJson<{ data: string; valor: string }[]>(url);
    for (const d of dados) {
      const [, mes, a] = d.data.split("/").map(Number);
      pontos.push(mensal(a, mes, Number(d.valor)));
    }
    // Folga entre janelas de 10 anos: consultas muito seguidas são bloqueadas pelo SGS.
    await new Promise((r) => setTimeout(r, 500));
  }
  return ordenar(pontos);
}

// ---------- Banco Mundial ----------

export async function bancoMundial(indicador: string): Promise<Ponto[]> {
  const url = `https://api.worldbank.org/v2/country/BRA/indicator/${indicador}?format=json&per_page=200`;
  const [, linhas] = await getJson<[unknown, { date: string; value: number | null }[]]>(url);
  return ordenar(linhas.filter((l) => l.value !== null).map((l) => anual(Number(l.date), l.value as number)));
}

// ---------- IBGE (SIDRA) ----------

/** Devolve as linhas de dados (sem o cabeçalho). */
export async function sidra(caminho: string): Promise<Record<string, string>[]> {
  const linhas = await getJson<Record<string, string>[]>(`https://apisidra.ibge.gov.br/values/${caminho}`);
  return linhas.slice(1);
}

// ---------- Saída ----------

export async function gravar(arquivo: string, series: Record<string, Serie>): Promise<void> {
  for (const [id, s] of Object.entries(series)) {
    const vistos = new Set<string>();
    s.pontos = s.pontos.filter((p) => !vistos.has(p.periodo) && vistos.add(p.periodo));
    if (s.pontos.length === 0) throw new Error(`Série vazia: ${id}`);
    const ultimo = s.pontos.at(-1) as Ponto;
    console.log(
      `${id.padEnd(24)} ${String(s.pontos.length).padStart(4)} pontos  ${s.pontos[0].periodo} → ${ultimo.periodo} = ${ultimo.valor}`,
    );
  }
  await mkdir(dirname(arquivo), { recursive: true });
  await writeFile(arquivo, JSON.stringify({ geradoEm: new Date().toISOString(), series }, null, 1) + "\n");
  console.log(`\nGravado em ${arquivo}`);
}
