import { describe, expect, it } from "vitest";
import { getMandato, mandatos } from "@/lib/mandatos";
import {
  classificar,
  comparar,
  desemprego,
  escolherPontos,
  fome,
  formatarDelta,
  indicadoresTabela,
  mapaDaFome,
  noMapaDaFome,
  rotuloPeriodo,
  type Ponto,
} from "@/lib/raiox";

const mandato = (slug: string) => {
  const m = getMandato(slug);
  if (!m) throw new Error(slug);
  return m;
};

describe("escolherPontos", () => {
  const trimestral: Ponto[] = [
    { periodo: "2016-T1", fim: "2016-03-31", valor: 10.9 },
    { periodo: "2016-T2", fim: "2016-06-30", valor: 11.3 },
    { periodo: "2016-T3", fim: "2016-09-30", valor: 11.8 },
  ];

  it("usa a última medição antes da posse e a última até o fim do mandato", () => {
    // Dilma 2 sai em 31/08/2016: o 3º trimestre ainda não tinha terminado.
    expect(escolherPontos(trimestral, "2016-01-01", "2016-08-31")).toEqual({
      inicio: undefined,
      fim: trimestral[1],
    });
    // Temer assume em 31/08/2016: herda o 2º trimestre.
    expect(escolherPontos(trimestral, "2016-08-31", "2018-12-31").inicio).toEqual(trimestral[1]);
  });

  it("ignora medições mais antigas que o limite de defasagem", () => {
    const esparsa: Ponto[] = [{ periodo: "2013", fim: "2013-12-31", valor: 3.6 }];
    expect(escolherPontos(esparsa, "2019-01-01", "2022-12-31", 3).inicio).toBeUndefined();
    expect(escolherPontos(esparsa, "2016-08-31", "2018-12-31", 3).inicio).toEqual(esparsa[0]);
  });

  it("não usa como fim uma medição anterior à posse", () => {
    const anual: Ponto[] = [{ periodo: "2018", fim: "2018-12-31", valor: 1 }];
    expect(escolherPontos(anual, "2019-01-01", "2022-12-31").fim).toBeUndefined();
  });
});

describe("classificar", () => {
  it("respeita a direção desejável do indicador", () => {
    expect(classificar(desemprego, 11.7, 7.9).status).toBe("melhorou");
    expect(classificar(desemprego, 6.6, 11.3).status).toBe("piorou");
    expect(classificar(desemprego, 7.0, 7.2).status).toBe("estavel");
  });

  it("usa tolerância relativa quando configurado", () => {
    expect(classificar(fome, 10, 10.4).status).toBe("estavel");
    expect(classificar(fome, 10, 6).status).toBe("melhorou");
  });
});

describe("dados reais por mandato", () => {
  it("compara o desemprego dentro de uma mesma pesquisa", () => {
    const bolsonaro = comparar(desemprego, mandato("bolsonaro"));
    expect(bolsonaro.serieId).toBe("desemprego_pnadc");
    expect(bolsonaro.inicio?.periodo).toBe("2018-T4");
    expect(bolsonaro.inicio?.valor).toBe(11.7);
    expect(bolsonaro.fim?.periodo).toBe("2022-T4");
    expect(bolsonaro.fim?.valor).toBe(7.9);
    expect(bolsonaro.status).toBe("melhorou");

    // Dilma 1 começa antes da PNAD Contínua existir: usa a PME do começo ao fim.
    const dilma1 = comparar(desemprego, mandato("dilma-1"));
    expect(dilma1.serieId).toBe("desemprego_pme");
    expect(dilma1.inicio?.valor).toBe(5.3);
    expect(dilma1.fim?.valor).toBe(4.3);

    expect(comparar(desemprego, mandato("fhc-1")).serieId).toBe("desemprego_pme_antiga");
  });

  it("mede a fome com a pesquisa do IBGE mais próxima", () => {
    const temer = comparar(fome, mandato("temer"));
    expect(temer.inicio?.periodo).toBe("2013");
    expect(temer.fim?.periodo).toBe("2018");
    expect(temer.status).toBe("piorou");
    // FHC terminou antes da primeira medição do IBGE (2004).
    expect(comparar(fome, mandato("fhc-2")).status).toBe("sem-dados");
  });

  it("marca a volta ao Mapa da Fome no mandato Bolsonaro", () => {
    const { inicio, fim } = mapaDaFome(mandato("bolsonaro"));
    expect(inicio && noMapaDaFome(inicio)).toBe(false);
    expect(fim && noMapaDaFome(fim)).toBe(true);
  });

  it("todo indicador tem valor na posse e no fim de pelo menos um mandato", () => {
    for (const ind of [desemprego, fome, ...indicadoresTabela]) {
      const algum = mandatos.some((m) => comparar(ind, m).status !== "sem-dados");
      expect(algum, ind.id).toBe(true);
    }
  });
});

describe("formatação", () => {
  it("mostra variação em pontos percentuais ou em %", () => {
    expect(formatarDelta(comparar(desemprego, mandato("bolsonaro")))).toBe("−3,8 pp");
    const desmat = comparar(indicadoresTabela.find((i) => i.id === "desmatamento")!, mandato("bolsonaro"));
    expect(formatarDelta(desmat)).toMatch(/^\+\d/);
  });

  it("escreve o período por extenso", () => {
    expect(rotuloPeriodo({ periodo: "2018-T4", fim: "2018-12-31", valor: 0 })).toBe("4º tri/2018");
    expect(rotuloPeriodo({ periodo: "2002-12", fim: "2002-12-31", valor: 0 })).toBe("dez/2002");
  });
});
