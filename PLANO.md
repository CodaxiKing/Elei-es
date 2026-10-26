# Observatório da Presidência — Plano de desenvolvimento

Site que mostra, mandato a mandato, **o que cada presidente propôs** e **como o país estava no início e no fim do governo**: preços de alimentos e combustíveis, emprego/desemprego, dívida pública e outros indicadores. Cor predominante: **preto**.

---

## 1. Escopo

**Presidentes cobertos (sugestão):** a partir de **FHC (1995)**. Antes do Plano Real (jul/1994) a hiperinflação e as trocas de moeda tornam a comparação de preços praticamente inútil.

| Presidente | Mandato |
|---|---|
| Fernando Henrique Cardoso | 1995–1998 / 1999–2002 |
| Luiz Inácio Lula da Silva | 2003–2006 / 2007–2010 |
| Dilma Rousseff | 2011–2014 / 2015–ago/2016 |
| Michel Temer | ago/2016–2018 |
| Jair Bolsonaro | 2019–2022 |
| Luiz Inácio Lula da Silva | 2023–2026 (em andamento) |

Cada mandato (não cada pessoa) é a unidade principal — Lula 1, 2 e 3 têm páginas próprias e uma página-resumo da pessoa.

**Seções do site**
1. **Home = Linha do tempo** — faixa 1995 → 2026 com um bloco por mandato (largura proporcional à duração, foto oficial). Clicar abre, logo abaixo, o painel do mandato: indicadores início → fim, "O que fez" (marcos), números (leis, MPs, vetos, emendas) e resumo das propostas.
2. **Página do mandato** — seções: Resumo · Preços · Emprego · Dívida · **O que fez** · Propostas.
3. **Comparador** — dois mandatos lado a lado (variação início → fim de cada indicador).
3b. **Mapa dos votos** — mapa do Brasil em preto, por estado (malha do IBGE). Escolhe a eleição (1994–2022) e o turno; passar o mouse num estado ou região mostra votos do eleito, % dos válidos, eleitores aptos e abstenção. Fonte: TSE — resultados por UF (Portal de Dados Abertos do TSE). Contornos já salvos em `data/mapa-uf.json`; votos reais de 1994 a 2022 (1º e 2º turno) já extraídos em `data/votos-presidente-uf.json`. Estados coloridos pela % dos válidos do eleito.
3c. **Apuração ao vivo** (só em dia de eleição) — mapa que vai se pintando com a cor de quem lidera em cada estado (tom mais forte = mais urnas apuradas), candidatos ao lado com foto, % e votos somando em tempo real, barra de urnas apuradas e estado em foco ao passar o mouse. Fonte: divulgação oficial de resultados do TSE (JSON por UF, atualizado a cada poucos segundos), lida por um job no servidor e repassada ao site com cache curto (ex.: 10 s) para aguentar o pico de acesso. Fora da eleição, a aba mostra o replay da última apuração.
4. **Indicador** — página de uma série (ex.: gasolina) com a série histórica inteira e as faixas de cada mandato pintadas no gráfico.
5. **Metodologia & fontes** — de onde vem cada número, como foi tratado, data da última atualização.

---

## 2. Indicadores e fontes oficiais

| Grupo | Indicador | Fonte |
|---|---|---|
| Alimentos | Cesta básica (por capital) | DIEESE — Pesquisa Nacional da Cesta Básica |
| Alimentos | Itens: arroz, feijão, carne, leite, café, óleo, pão… | DIEESE (preço médio) + IPCA subitens (IBGE/SIDRA) |
| Combustíveis | Gasolina, etanol, diesel, GLP (botijão 13 kg) | ANP — Levantamento de Preços de Combustíveis (série histórica semanal/mensal) |
| Inflação | IPCA acumulado no mandato | IBGE/SIDRA (tabela 1737) |
| Emprego | Taxa de desocupação | IBGE — PNAD Contínua (a partir de 2012) |
| Emprego | Antes de 2012 | PME/IBGE (6 regiões metropolitanas) — avisar que a metodologia é diferente |
| Emprego | Saldo de empregos formais | Novo CAGED / CAGED (MTE) |
| Renda | Salário mínimo (nominal e real) | Legislação + IPCA |
| Dívida | Dívida Bruta do Governo Geral (% PIB) | Banco Central — SGS |
| Dívida | Dívida Líquida do Setor Público (% PIB) | Banco Central — SGS |
| Outros | Selic, dólar (PTAX), PIB, IDH, pobreza, desmatamento | BCB SGS, IBGE, PNUD, INPE |
| Propostas | Plano de governo registrado | TSE — DivulgaCandContas |

> Os códigos exatos das séries (SGS/SIDRA) devem ser confirmados no início da fase de dados e registrados em `data/sources.json`.

**Regras de tratamento**
- Mostrar sempre **valor nominal** e **valor corrigido pela inflação (IPCA)** — com toggle. Sem isso, comparar 2003 com 2023 engana.
- "Início do mandato" = mês da posse; "fim" = último mês completo do mandato (ou último dado disponível se em andamento, com selo "parcial").
- Toda métrica exibe fonte, data de coleta e link.

---

## 2b. Raio-X social (aba de cada mandato) ✅ dados reais no site

Comparação direta **na posse × no fim do mandato**, com seta, variação e selo "melhorou / piorou / estável" (segue a direção desejável de cada indicador).

Implementado: coletor `etl/raiox.ts` (`npm run etl:raiox`), séries em `data/raiox/series.json`, regras em `lib/raiox.ts`. Séries usadas de fato:
- Desemprego: PNAD Contínua (SIDRA 4099) → PME (Ipeadata PAN12_TD12, 2002–2015) → PME antiga (PME12_TDA12, até 2002). Cada mandato usa uma única pesquisa do começo ao fim.
- Fome: IBGE tabela 6665 (% de moradores em insegurança alimentar grave, 2004/2009/2013/2018/2023/2024) × população; Rede PENSSAN (2020, 2022) mostrada à parte em `data/raiox/manual.json`.
- Mapa da Fome: FAO, prevalência de subalimentação (Banco Mundial SN.ITK.DEFC.ZS).
- Pobreza extrema (US$ 3,00/dia, PPC 2021) e Gini: IPEA (PNADS_PERCPOBRE300, PNADS_GINI).
- Mortalidade infantil e expectativa de vida: ONU via Banco Mundial. Homicídios: Atlas da Violência (AVIOL12_THOMIC).
- Desmatamento: INPE PRODES (arquivo oficial do TerraBrasilis).

| Indicador | Fonte | Observação |
|---|---|---|
| Taxa de desemprego (e nº de desempregados) | IBGE — PNAD Contínua (trimestral) | Antes de 2012: PME (6 regiões metropolitanas), com aviso de quebra de série |
| Pessoas em insegurança alimentar grave (fome) | IBGE — EBIA na PNAD 2004/2009/2013, POF 2017-18, PNAD Contínua 2023; Rede PENSSAN (VIGISAN 2020 e 2022) | Não é medido todo ano: usa a medição mais próxima, com a data visível |
| Brasil no Mapa da Fome da ONU (sim/não) | FAO — SOFI (prevalência de subalimentação > 2,5%, média de 3 anos) | |
| Extrema pobreza | IBGE — Síntese de Indicadores Sociais / Banco Mundial | Linha internacional de pobreza extrema |
| Desigualdade (Gini) | IBGE — PNAD | |
| Renda média do trabalho (real) | IBGE — PNAD Contínua | Corrigida pelo IPCA |
| Salário mínimo real | Legislação + IPCA | |
| Inflação em 12 meses | IBGE — IPCA | |
| Homicídios por 100 mil | Atlas da Violência (Ipea/FBSP) | Defasagem de ~2 anos |
| Mortalidade infantil | DataSUS / IBGE | |
| Expectativa de vida | IBGE — Tábuas de mortalidade | |
| Desmatamento na Amazônia | INPE — PRODES | Ano PRODES vai de ago a jul |
| Informalidade | IBGE — PNAD Contínua | A partir de 2016 |

## 3. Propostas — curadoria

É a parte mais sensível do site (risco de parecer partidário). Regras:
- Fonte primária: **plano de governo registrado no TSE**, com página/trecho citado.
- Status por proposta: **Cumprida · Parcial · Em andamento · Não cumprida · Sem dados**, cada um com **evidência linkada** (lei, decreto, dado oficial).
- Mesmo critério e mesmo nível de detalhe para todos os presidentes.
- Categorias fixas: Economia, Saúde, Educação, Segurança, Infraestrutura, Meio ambiente, Social.
- Arquivo por mandato em `content/propostas/<mandato>.yaml`, revisável via PR.

---

## 3b. "O que fez" — ações do governo

Além das propostas, cada mandato lista o que de fato aconteceu:
- **Marcos**: leis, emendas constitucionais, programas, privatizações, crises — cada um com data, tipo, descrição neutra de 1 linha e número do ato (ex.: `EC 103/2019`). Arquivo `content/marcos/<mandato>.yaml`.
- **Em números**: leis sancionadas, medidas provisórias, vetos, emendas, decretos, viagens internacionais.
- **Fontes**: Portal da Legislação do Planalto (planalto.gov.br/legislacao), Dados Abertos da Câmara e do Senado (MPs e vetos), Agenda do Presidente.
- Mesmo número de marcos e mesmo critério de seleção para todos os mandatos.
- **Impostos**: cada tributo criado, aumentado, reduzido ou extinto no mandato, com "para que serve", ato legal e impacto anual na arrecadação. Fontes: Receita Federal (legislação e séries de arrecadação) e Planalto. Arquivo `content/impostos/<mandato>.yaml`.

## 4. Stack técnica

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Páginas estáticas (SSG) com revalidação — rápido e barato |
| Estilo | **Tailwind CSS** com tokens do tema escuro | Paleta preta consistente |
| Gráficos | **ECharts** (ou Recharts) | Linhas com faixas por mandato, zoom, tooltip |
| Dados | Scripts ETL em Node/TS → JSON versionado em `data/` | Sem banco no MVP; fácil de auditar |
| Conteúdo | YAML/MDX para propostas e textos | Editável sem mexer em código |
| Atualização | **GitHub Actions** (cron semanal) rodando o ETL e abrindo PR | Dados sempre atuais e revisados |
| Deploy | Vercel (ou Cloudflare Pages) | Grátis para começar |
| Testes | Vitest (ETL e cálculos) + Playwright (fluxos) | Os números precisam estar certos |

**Estrutura de pastas**
```
Lei/
├─ app/                 # rotas Next.js
│  ├─ page.tsx          # Home
│  ├─ mandato/[slug]/   # página do mandato (+ abas)
│  ├─ comparar/         # comparador
│  ├─ indicador/[id]/   # série histórica
│  └─ metodologia/
├─ components/          # KpiCard, PriceChart, Timeline, ProposalList…
├─ lib/                 # cálculo de variações, correção pelo IPCA
├─ etl/                 # coletores: anp.ts, bcb.ts, ibge.ts, dieese.ts, caged.ts
├─ data/                # JSON gerado (séries) + sources.json
└─ content/propostas/   # YAML por mandato
```

---

## 5. Identidade visual

Estilo **radical / brutalista**: tipografia gigante condensada, cantos retos, bordas grossas, contraste máximo.

- **Fundo:** preto puro `#000000`, superfícies `#0B0B0B` / `#111111`, linhas `#262626`.
- **Texto:** `#FFFFFF` (principal), `#A6A6A6` (secundário).
- **Destaque:** vermelho `#FF2D2D` (marca, mandato selecionado, ticker, rodapé).
- **Dados:** subiu = âmbar `#FFB020`, caiu = azul `#3DA5FF` (diferem do vermelho da marca e em luminosidade, legível para daltônicos).
- **Status das propostas:** cumprida = azul, parcial = âmbar, não cumprida = vermelho, sem dados = cinza.
- **Tipografia:** Anton (títulos em caixa alta, enormes, às vezes só contorno), Space Grotesk (texto), JetBrains Mono (números e rótulos).
- **Banner de cada presidente:** foto oficial grande (retrato da Presidência / Agência Brasil, com crédito e licença), em P&B com faixa de cor de destaque. Carrossel na Home; banner de topo na página do mandato; dois banners frente a frente ("VS") no comparador.
- **Ticker** de cotações correndo no topo; seções numeradas `01 PREÇOS`, `02 EMPREGO`…; bloco de propostas em fundo branco ("Promessa × realidade").

---

## 6. Fases

| Fase | Entrega | Estimativa |
|---|---|---|
| **0. Definições** | Lista final de indicadores, presidentes, fontes e códigos de série confirmados | 2–3 dias |
| **1. Projeto base** ✅ | Next.js 16 + Tailwind 4 + tema preto/vermelho + layout (header, footer, navegação) e páginas base de todas as rotas | concluída |
| **2. ETL de dados** | Coletores BCB, IBGE, ANP, DIEESE, CAGED → `data/*.json`; função de correção pelo IPCA; testes | 1–2 semanas |
| **3. Home + linha do tempo** | Timeline de presidentes, KPIs atuais | 3 dias |
| **4. Página do mandato** | Abas Resumo/Preços/Emprego/Dívida com gráficos e "início vs fim" | 1 semana |
| **5. Propostas** | Schema YAML, curadoria de 1 mandato como piloto, depois os demais | contínuo (2–4 semanas) |
| **6. Comparador + página de indicador** | Seleção de 2 mandatos, gráficos com faixas por mandato | 4–5 dias |
| **7. Metodologia, SEO, acessibilidade** | Página de fontes, meta tags, contraste AA, versão mobile | 3 dias |
| **8. Automação + deploy** | GitHub Actions semanal, deploy Vercel, domínio | 2 dias |

**MVP sugerido:** fases 0–4 com 3 mandatos (Temer, Bolsonaro, Lula 3) e indicadores de gasolina, diesel, cesta básica, desemprego e dívida bruta. Depois amplia.

---

## 7. Riscos

- **Metodologias que mudam** (PME → PNAD Contínua; CAGED → Novo CAGED): mostrar quebra de série no gráfico.
- **Mandatos interrompidos** (Dilma/Temer em 2016): definir o mês de corte e explicar.
- **Neutralidade:** critérios iguais para todos, evidências linkadas, página de metodologia pública.
- **APIs instáveis** (ANP publica planilhas, DIEESE não tem API): versionar os arquivos brutos baixados.
