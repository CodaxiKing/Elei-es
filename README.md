# Observatório da Presidência

Site que mostra, mandato a mandato desde 1995, o que cada presidente propôs e fez, e como estavam preços, emprego, dívida pública e votos. Plano completo em [PLANO.md](PLANO.md).

## Rodando

```bash
npm install
npm run dev
```

Abre em http://localhost:3000.

```bash
npm run lint
npm test
npm run build
```

Atualizar os dados do Raio-X social (baixa tudo de novo das fontes oficiais e regrava `data/raiox/series.json`):

```bash
npm run etl:raiox
```

## Estrutura

| Pasta | O que tem |
|---|---|
| `app/` | Rotas: `/` (linha do tempo), `/mandato/[slug]`, `/comparar`, `/mapa`, `/apuracao`, `/metodologia` |
| `components/` | Header, menu, footer e blocos compartilhados |
| `lib/mandatos.ts` | Os 9 mandatos (datas, fotos, créditos) |
| `data/` | Dados já extraídos: votos por UF do TSE (1994–2022), contornos dos estados (IBGE) e séries do Raio-X social (`data/raiox/`) |
| `etl/` | Coletores que baixam os dados das fontes oficiais |
| `lib/raiox.ts` | Regras de "na posse × no fim" de cada indicador (testadas em `lib/raiox.test.ts`) |
| `public/presidentes/` | Fotos oficiais e [créditos](public/presidentes/CREDITOS.md) |

Stack: Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, TypeScript. Cores e fontes do tema ficam em `app/globals.css` (`@theme`).
