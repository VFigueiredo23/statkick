export const URL_API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Equipe = {
  id: number;
  nome: string;
  brasao?: string | null;
  categoria_organizacao?: string;
  informacoes_analista?: string;
};

export type Jogador = {
  id: number;
  nome: string;
  posicao: string;
  equipe: number | null;
  equipe_nome?: string;
  idade: number;
  independente: boolean;
  categoria_organizacao?: string;
  informacoes_analista?: string;
  foto?: string | null;
  avaliacoes?: AvaliacaoJogador[];
  ultima_avaliacao?: AvaliacaoJogador | null;
  avaliacao_anterior?: AvaliacaoJogador | null;
};

export type AvaliacaoJogador = {
  id: number;
  jogador: number;
  data_avaliacao: string;
  observacoes: string;
  tecnica: number;
  fisico: number;
  velocidade: number;
  inteligencia_tatica: number;
  competitividade: number;
  potencial: number;
  nota_geral: number;
};

export type Partida = {
  id: number;
  equipe_casa: number;
  equipe_casa_nome?: string;
  equipe_fora: number;
  equipe_fora_nome?: string;
  competicao: string;
  data: string;
  tipo_video: "upload" | "link";
  url_video: string;
  arquivo_video?: string | null;
  tamanho_armazenamento_video: number;
};

export type PayloadPartida = {
  equipe_casa_nome_input: string;
  equipe_fora_nome_input: string;
  competicao: string;
  tipo_video: "upload" | "link";
  url_video?: string;
  arquivo_video?: File;
};

export type Evento = {
  id: number;
  partida: number;
  equipe: number | null;
  equipe_nome?: string;
  jogador: number | null;
  jogador_nome?: string;
  tipo_evento: string;
  minuto: number;
  segundo: number;
  posicao_x?: number | null;
  posicao_y?: number | null;
  observacoes: string;
};

export type PayloadJogador = {
  nome: string;
  posicao: string;
  equipe: number | null;
  idade: number;
  independente: boolean;
  categoria_organizacao?: string;
  informacoes_analista?: string;
  foto?: File | null;
};

export type PayloadAvaliacaoJogador = {
  jogador: number;
  observacoes?: string;
  tecnica: number;
  fisico: number;
  velocidade: number;
  inteligencia_tatica: number;
  competitividade: number;
  potencial: number;
};

export type PayloadEquipe = {
  nome: string;
  brasao?: File | null;
  categoria_organizacao?: string;
  informacoes_analista?: string;
};

function normalizarUrlVideo(partida: Partida): Partida {
  if (!partida.url_video) return partida;
  if (partida.url_video.startsWith("http://") || partida.url_video.startsWith("https://")) return partida;
  return { ...partida, url_video: `${URL_API}${partida.url_video}` };
}

function normalizarBrasao(equipe: Equipe): Equipe {
  if (!equipe.brasao) return equipe;
  if (equipe.brasao.startsWith("http://") || equipe.brasao.startsWith("https://")) return equipe;
  return { ...equipe, brasao: `${URL_API}${equipe.brasao}` };
}

function normalizarFotoJogador(jogador: Jogador): Jogador {
  if (!jogador.foto) return jogador;
  if (jogador.foto.startsWith("http://") || jogador.foto.startsWith("https://")) return jogador;
  return { ...jogador, foto: `${URL_API}${jogador.foto}` };
}

export async function listarPartidas(): Promise<Partida[]> {
  const resposta = await fetch(`${URL_API}/partidas`, { cache: "no-store" });
  if (!resposta.ok) throw new Error("Falha ao carregar partidas");
  const dados = (await resposta.json()) as Partida[];
  return dados.map(normalizarUrlVideo);
}

export async function buscarPartida(partidaId: string): Promise<Partida> {
  const resposta = await fetch(`${URL_API}/partidas/${partidaId}`, { cache: "no-store" });
  if (!resposta.ok) throw new Error("Falha ao carregar partida");
  return normalizarUrlVideo(await resposta.json());
}

export async function listarEventosDaPartida(partidaId: string): Promise<Evento[]> {
  const resposta = await fetch(`${URL_API}/partidas/${partidaId}/eventos`, { cache: "no-store" });
  if (!resposta.ok) throw new Error("Falha ao carregar eventos");
  return resposta.json();
}

export async function listarEquipes(): Promise<Equipe[]> {
  const resposta = await fetch(`${URL_API}/equipes`, { cache: "no-store" });
  if (!resposta.ok) throw new Error("Falha ao carregar equipes");
  const dados = (await resposta.json()) as Equipe[];
  return dados.map(normalizarBrasao);
}

export async function listarJogadores(): Promise<Jogador[]> {
  const resposta = await fetch(`${URL_API}/jogadores`, { cache: "no-store" });
  if (!resposta.ok) throw new Error("Falha ao carregar jogadores");
  const dados = (await resposta.json()) as Jogador[];
  return dados.map(normalizarFotoJogador);
}

export async function criarJogador(payload: PayloadJogador): Promise<Jogador> {
  const formData = new FormData();
  formData.append("nome", payload.nome);
  formData.append("posicao", payload.posicao);
  formData.append("idade", String(payload.idade));
  formData.append("independente", String(payload.independente));
  formData.append("categoria_organizacao", payload.categoria_organizacao ?? "");
  formData.append("informacoes_analista", payload.informacoes_analista ?? "");
  formData.append("equipe", payload.equipe === null ? "" : String(payload.equipe));
  if (payload.foto) {
    formData.append("foto", payload.foto);
  }

  const resposta = await fetch(`${URL_API}/jogadores`, {
    method: "POST",
    body: formData
  });

  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error(erro || "Falha ao criar jogador");
  }

  return normalizarFotoJogador(await resposta.json());
}

export async function atualizarJogador(jogadorId: number, payload: PayloadJogador): Promise<Jogador> {
  const formData = new FormData();
  formData.append("nome", payload.nome);
  formData.append("posicao", payload.posicao);
  formData.append("idade", String(payload.idade));
  formData.append("independente", String(payload.independente));
  formData.append("categoria_organizacao", payload.categoria_organizacao ?? "");
  formData.append("informacoes_analista", payload.informacoes_analista ?? "");
  formData.append("equipe", payload.equipe === null ? "" : String(payload.equipe));
  if (payload.foto) {
    formData.append("foto", payload.foto);
  }

  const resposta = await fetch(`${URL_API}/jogadores/${jogadorId}`, {
    method: "PATCH",
    body: formData
  });

  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error(erro || "Falha ao atualizar jogador");
  }

  return normalizarFotoJogador(await resposta.json());
}

export async function criarAvaliacaoJogador(payload: PayloadAvaliacaoJogador): Promise<AvaliacaoJogador> {
  const resposta = await fetch(`${URL_API}/avaliacoes-jogador`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error(erro || "Falha ao criar avaliacao do jogador");
  }

  return resposta.json();
}

export async function criarEquipe(payload: PayloadEquipe): Promise<Equipe> {
  const formData = new FormData();
  formData.append("nome", payload.nome);
  formData.append("categoria_organizacao", payload.categoria_organizacao ?? "");
  formData.append("informacoes_analista", payload.informacoes_analista ?? "");
  if (payload.brasao) {
    formData.append("brasao", payload.brasao);
  }

  const resposta = await fetch(`${URL_API}/equipes`, {
    method: "POST",
    body: formData
  });

  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error(erro || "Falha ao criar equipe");
  }

  return normalizarBrasao(await resposta.json());
}

export async function atualizarEquipe(equipeId: number, payload: PayloadEquipe): Promise<Equipe> {
  const formData = new FormData();
  formData.append("nome", payload.nome);
  formData.append("categoria_organizacao", payload.categoria_organizacao ?? "");
  formData.append("informacoes_analista", payload.informacoes_analista ?? "");
  if (payload.brasao) {
    formData.append("brasao", payload.brasao);
  }

  const resposta = await fetch(`${URL_API}/equipes/${equipeId}`, {
    method: "PATCH",
    body: formData
  });

  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error(erro || "Falha ao atualizar equipe");
  }

  return normalizarBrasao(await resposta.json());
}

export async function criarEvento(payload: Omit<Evento, "id" | "equipe_nome" | "jogador_nome">): Promise<Evento> {
  const resposta = await fetch(`${URL_API}/eventos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error(erro || "Falha ao salvar evento");
  }

  return resposta.json();
}

export async function criarPartida(payload: PayloadPartida): Promise<Partida> {
  const temArquivo = payload.tipo_video === "upload" && payload.arquivo_video;

  let resposta: Response;
  if (temArquivo) {
    const formData = new FormData();
    formData.append("equipe_casa_nome_input", payload.equipe_casa_nome_input);
    formData.append("equipe_fora_nome_input", payload.equipe_fora_nome_input);
    formData.append("competicao", payload.competicao);
    formData.append("tipo_video", payload.tipo_video);
    formData.append("arquivo_video", payload.arquivo_video as File);
    resposta = await fetch(`${URL_API}/partidas`, {
      method: "POST",
      body: formData
    });
  } else {
    resposta = await fetch(`${URL_API}/partidas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error(erro || "Falha ao criar partida");
  }

  return normalizarUrlVideo(await resposta.json());
}
