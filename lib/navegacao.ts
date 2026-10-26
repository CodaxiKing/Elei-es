export type ItemMenu = {
  href: string;
  label: string;
  /** Destaque vermelho com ponto pulsando (usado na apuração). */
  aoVivo?: boolean;
};

export const menu: ItemMenu[] = [
  { href: "/", label: "Linha do tempo" },
  { href: "/comparar", label: "Comparar" },
  { href: "/mapa", label: "Mapa" },
  { href: "/apuracao", label: "Apuração", aoVivo: true },
  { href: "/metodologia", label: "Metodologia" },
];
