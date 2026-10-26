import { AvisoParcial, CartaoDestaque, NotaMetodo, TabelaComparacao } from "@/components/Comparacao";
import { dividaBruta, dividaLiquida, dividaTabela } from "@/lib/economia";
import { atualizadoEm, comparar } from "@/lib/indicadores";
import type { Mandato } from "@/lib/mandatos";

export function Divida({ m }: { m: Mandato }) {
  const juros = dividaTabela.filter((ind) => ind !== dividaBruta && ind !== dividaLiquida);
  return (
    <div className="flex flex-col gap-8">
      {m.emAndamento && <AvisoParcial />}

      <div className="flex flex-wrap gap-6">
        <CartaoDestaque
          titulo="Dívida bruta"
          unidade="do PIB, governo geral (União, estados e municípios)"
          c={comparar(dividaBruta, m)}
          semDados={<p>A série da dívida bruta do Banco Central começa em 2002.</p>}
        />
        <CartaoDestaque
          titulo="Dívida líquida"
          unidade="do PIB, setor público consolidado (dívidas menos ativos)"
          c={comparar(dividaLiquida, m)}
          semDados={<p>Sem dados da dívida líquida na posse e no fim deste mandato.</p>}
        />
      </div>

      <TabelaComparacao legenda="Juros e câmbio na posse e no fim do mandato" linhas={juros.map((ind) => comparar(ind, m))} />

      <NotaMetodo data={atualizadoEm.economia}>
        Juros e dólar não têm direção boa ou ruim por si só, então aparecem só como &quot;subiu&quot; ou &quot;caiu&quot;.
      </NotaMetodo>
    </div>
  );
}
