import { AvisoParcial, CartaoDestaque, Fonte, NotaMetodo, TabelaComparacao } from "@/components/Comparacao";
import { cestaBasica, cestaNoSalario, precosTabela } from "@/lib/economia";
import { acumuladoNoMandato, atualizadoEm, comparar, formatar, getSerie, rotuloPeriodo } from "@/lib/indicadores";
import type { Mandato } from "@/lib/mandatos";

function InflacaoNoMandato({ m }: { m: Mandato }) {
  const alimentos = acumuladoNoMandato("ipca_alimentos_mensal", m);
  const geral = acumuladoNoMandato("ipca_mensal", m);
  if (!alimentos || !geral) return null;
  const comidaMais = alimentos.valor > geral.valor;
  const periodo = `${rotuloPeriodo(geral.de)} a ${rotuloPeriodo(geral.ate)}`;
  return (
    <section aria-labelledby="h-inflacao-mandato" className="flex flex-wrap border-2 border-accent">
      <div className="flex min-w-0 flex-[1_1_320px] flex-col justify-center gap-2 p-5">
        <h3 id="h-inflacao-mandato" className="font-display text-[clamp(26px,3vw,34px)] leading-none uppercase">
          A comida subiu {comidaMais ? "mais" : "menos"} que o resto?
        </h3>
        <p className="text-sm text-muted">Inflação acumulada durante o mandato ({periodo}), pelo IPCA.</p>
        <Fonte url={getSerie("ipca_alimentos_mensal").url}>
          <span className="font-mono text-[11px]">FONTE: IBGE — IPCA (VIA BANCO CENTRAL)</span>
        </Fonte>
      </div>
      <div className={`flex flex-[0_1_240px] flex-col justify-center gap-1.5 border-l border-line p-5 ${comidaMais ? "bg-accent text-ink" : ""}`}>
        <span className="text-xs font-bold uppercase">Alimentação e bebidas</span>
        <span className="font-display text-[52px] leading-[0.9]">{formatar(alimentos.valor, "pct", 1)}</span>
      </div>
      <div className="flex flex-[0_1_240px] flex-col justify-center gap-1.5 border-l border-line p-5">
        <span className="text-xs font-bold uppercase">Inflação geral</span>
        <span className="font-display text-[52px] leading-[0.9]">{formatar(geral.valor, "pct", 1)}</span>
      </div>
    </section>
  );
}

export function Precos({ m }: { m: Mandato }) {
  return (
    <div className="flex flex-col gap-8">
      {m.emAndamento && <AvisoParcial />}

      <div className="flex flex-wrap gap-6">
        <CartaoDestaque
          titulo="Cesta básica"
          unidade="por mês, cesta do DIEESE em São Paulo"
          c={comparar(cestaBasica, m)}
          semDados={<p>A pesquisa da cesta básica em reais começa com o Plano Real, em julho de 1994.</p>}
        />
        <CartaoDestaque
          titulo="Cesta no salário mínimo"
          unidade="do salário mínimo bruto gasto com uma cesta básica"
          c={comparar(cestaNoSalario, m)}
          semDados={<p>Sem dados da cesta e do salário mínimo na posse e no fim deste mandato.</p>}
        />
      </div>

      <InflacaoNoMandato m={m} />

      <TabelaComparacao
        legenda="Preços de alimentos e combustíveis na posse e no fim do mandato"
        linhas={precosTabela.map((ind) => comparar(ind, m))}
        mostrarReal
      />

      <NotaMetodo data={atualizadoEm.economia}>
        Preços aparecem em valores da época; a coluna &quot;descontada a inflação&quot; corrige pelo IPCA do período e é ela
        que define se o preço melhorou ou piorou. A pesquisa de combustíveis da ANP começa em julho de 2001.
      </NotaMetodo>
    </div>
  );
}
