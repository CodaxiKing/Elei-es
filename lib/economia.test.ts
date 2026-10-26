import { describe, expect, it } from "vitest";
import { cestaBasica, cestaNoSalario, dividaBruta, dividaLiquida, dividaTabela, precosTabela } from "@/lib/economia";
import { acumuladoNoMandato, comparar, getSerie, inflacaoEntre } from "@/lib/indicadores";
import { getMandato, mandatos } from "@/lib/mandatos";

const mandato = (slug: string) => {
  const m = getMandato(slug);
  if (!m) throw new Error(slug);
  return m;
};

describe("séries de economia", () => {
  it("a pesquisa de combustíveis da ANP começa em julho de 2001", () => {
    for (const ind of precosTabela.filter((i) => i.id !== "cesta")) {
      expect(getSerie(ind.series[0]).pontos[0].periodo, ind.id).toBe("2001-07");
    }
    // Antes de 2001 não há combustível para comparar.
    expect(comparar(precosTabela[1], mandato("fhc-1")).status).toBe("sem-dados");
  });

  it("o combustível e a cesta cobrem mandatos recentes", () => {
    expect(comparar(precosTabela[1], mandato("bolsonaro")).status).not.toBe("sem-dados");
    expect(comparar(cestaBasica, mandato("lula-3")).status).not.toBe("sem-dados");
  });
});

describe("comparação de preços e dívida", () => {
  it("todo indicador tem valor na posse e no fim de pelo menos um mandato", () => {
    for (const ind of [...precosTabela, cestaNoSalario, ...dividaTabela]) {
      const algum = mandatos.some((m) => comparar(ind, m).status !== "sem-dados");
      expect(algum, ind.id).toBe(true);
    }
  });

  it("corrige a variação de preço pela inflação do período", () => {
    const c = comparar(cestaBasica, mandato("bolsonaro"));
    expect(c.variacaoReal).toBeDefined();
    const inflacao = inflacaoEntre(c.inicio!, c.fim!)!;
    expect(inflacao).toBeGreaterThan(0);
    expect(c.variacaoReal!).toBeCloseTo(c.fim!.valor / c.inicio!.valor / (1 + inflacao) - 1, 6);
    // O selo acompanha a variação real, não a nominal.
    const real = c.variacaoReal!;
    expect(c.status).toBe(Math.abs(real) <= c.indicador.tolerancia ? "estavel" : real < 0 ? "melhorou" : "piorou");
  });

  it("dívida e juros comparam a dívida bruta e a líquida em % do PIB", () => {
    const bruta = comparar(dividaBruta, mandato("lula-2"));
    expect(bruta.serieId).toBe("divida_bruta");
    expect(bruta.serie?.unidade).toBe("% do PIB");

    const liquida = comparar(dividaLiquida, mandato("dilma-1"));
    expect(liquida.serieId).toBe("divida_liquida");
    expect(liquida.inicio?.valor).toBeGreaterThan(0);
  });

  it("juros e dólar só dizem se subiu ou caíram", () => {
    for (const slug of ["fhc-1", "lula-3", "bolsonaro"]) {
      const selic = comparar(dividaTabela.find((i) => i.id === "selic")!, mandato(slug));
      expect(["subiu", "caiu", "estavel", "sem-dados"]).toContain(selic.status);
    }
  });
});

describe("inflação no mandato", () => {
  it("acumula o IPCA mês a mês dentro do mandato", () => {
    const m = mandato("bolsonaro");
    const acumulado = acumuladoNoMandato("ipca_mensal", m);
    expect(acumulado).toBeDefined();
    expect(acumulado!.valor).toBeGreaterThan(0);
    expect(acumulado!.de.fim > m.inicio).toBe(true);
    expect(acumulado!.ate.fim <= m.fim).toBe(true);
  });
});
