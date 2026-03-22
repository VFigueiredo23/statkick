export const EVENTO_ATALHOS = [
  { tecla: "1", tipo: "Passe" },
  { tecla: "2", tipo: "Passe chave" },
  { tecla: "3", tipo: "Drible" },
  { tecla: "4", tipo: "Finalizacao" },
  { tecla: "5", tipo: "Cruzamento" },
  { tecla: "6", tipo: "Recuperacao" },
  { tecla: "7", tipo: "Desarme" },
  { tecla: "8", tipo: "Pressao" },
] as const;

export const EVENTO_ATALHO_MAPA = Object.fromEntries(EVENTO_ATALHOS.map((item) => [item.tipo, item.tecla])) as Record<string, string>;

export const FERRAMENTA_ATALHOS = [
  { tecla: "V", ferramenta: "cursor" },
  { tecla: "H", ferramenta: "holofote" },
  { tecla: "A", ferramenta: "anel" },
  { tecla: "L", ferramenta: "linha" },
  { tecla: "S", ferramenta: "seta" },
  { tecla: "B", ferramenta: "retangulo" },
  { tecla: "R", ferramenta: "rota" },
] as const;
