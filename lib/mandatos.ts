export type Foto = {
  src: string;
  credito: string;
};

export type Mandato = {
  slug: string;
  numero: number;
  presidente: string;
  curto: string;
  inicio: string;
  fim: string;
  /** Duração em anos, usada para a largura proporcional na linha do tempo. */
  anos: number;
  emAndamento: boolean;
  foto: Foto;
};

const fotos = {
  fhc: { src: "/presidentes/fhc.jpg", credito: "Agência Brasil · CC BY 3.0 BR" },
  lula2007: { src: "/presidentes/lula-2007.jpg", credito: "Ricardo Stuckert/PR · CC BY 2.5" },
  dilma: { src: "/presidentes/dilma.jpg", credito: "Roberto Stuckert Filho/PR" },
  temer: { src: "/presidentes/temer.jpg", credito: "Beto Barata/PR · CC BY 2.0" },
  bolsonaro: { src: "/presidentes/bolsonaro.jpg", credito: "Isac Nóbrega/PR · CC BY 2.0" },
  lula2023: { src: "/presidentes/lula-2023.jpg", credito: "Ricardo Stuckert/PR · CC BY 2.0" },
} satisfies Record<string, Foto>;

export const mandatos: Mandato[] = [
  { slug: "fhc-1", numero: 1, presidente: "Fernando Henrique Cardoso", curto: "FHC 1", inicio: "1995-01-01", fim: "1998-12-31", anos: 4, emAndamento: false, foto: fotos.fhc },
  { slug: "fhc-2", numero: 2, presidente: "Fernando Henrique Cardoso", curto: "FHC 2", inicio: "1999-01-01", fim: "2002-12-31", anos: 4, emAndamento: false, foto: fotos.fhc },
  { slug: "lula-1", numero: 3, presidente: "Luiz Inácio Lula da Silva", curto: "Lula 1", inicio: "2003-01-01", fim: "2006-12-31", anos: 4, emAndamento: false, foto: fotos.lula2007 },
  { slug: "lula-2", numero: 4, presidente: "Luiz Inácio Lula da Silva", curto: "Lula 2", inicio: "2007-01-01", fim: "2010-12-31", anos: 4, emAndamento: false, foto: fotos.lula2007 },
  { slug: "dilma-1", numero: 5, presidente: "Dilma Rousseff", curto: "Dilma 1", inicio: "2011-01-01", fim: "2014-12-31", anos: 4, emAndamento: false, foto: fotos.dilma },
  { slug: "dilma-2", numero: 6, presidente: "Dilma Rousseff", curto: "Dilma 2", inicio: "2015-01-01", fim: "2016-08-31", anos: 1.67, emAndamento: false, foto: fotos.dilma },
  { slug: "temer", numero: 7, presidente: "Michel Temer", curto: "Temer", inicio: "2016-08-31", fim: "2018-12-31", anos: 2.33, emAndamento: false, foto: fotos.temer },
  { slug: "bolsonaro", numero: 8, presidente: "Jair Bolsonaro", curto: "Bolsonaro", inicio: "2019-01-01", fim: "2022-12-31", anos: 4, emAndamento: false, foto: fotos.bolsonaro },
  { slug: "lula-3", numero: 9, presidente: "Luiz Inácio Lula da Silva", curto: "Lula 3", inicio: "2023-01-01", fim: "2026-12-31", anos: 4, emAndamento: true, foto: fotos.lula2023 },
];

export function getMandato(slug: string): Mandato | undefined {
  return mandatos.find((m) => m.slug === slug);
}

/** "01/1995 — 12/1998" */
export function periodo(m: Mandato): string {
  const mesAno = (iso: string) => `${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
  return `${mesAno(m.inicio)} — ${mesAno(m.fim)}`;
}

/** "1995—1998", ou "15—16" para mandatos curtos que ocupam pouco espaço na linha do tempo. */
export function anosLabel(m: Mandato): string {
  const digitos = m.anos < 3 ? 2 : 4;
  return `${m.inicio.slice(4 - digitos, 4)}—${m.fim.slice(4 - digitos, 4)}`;
}

export function numeroLabel(m: Mandato): string {
  return String(m.numero).padStart(2, "0");
}
