import {
  limparSessaoLocal,
  notificarSessaoAlterada,
  obterOrganizacaoIdArmazenado,
  obterTokenArmazenado,
  salvarOrganizacaoId,
  salvarToken,
} from "@/lib/auth-storage";

export const URL_API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class UnauthorizedError extends Error {
  constructor(message = "Sessao expirada ou nao autenticada.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export type UsuarioLogado = {
  id: number;
  nome: string;
  email: string;
  plano: string;
  armazenamento_usado: number;
  limite_armazenamento: number;
  criado_em: string;
};

export type OrganizacaoResumo = {
  id: number;
  nome: string;
  slug: string;
  status: string;
  criado_em: string;
  papel?: string;
};

export type AuthPayload = {
  token: string;
  usuario: UsuarioLogado;
  organizacoes: OrganizacaoResumo[];
  organizacao_atual: OrganizacaoResumo | null;
};

export type AuthSessionPayload = Omit<AuthPayload, "token">;

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegistroPayload = {
  nome: string;
  email: string;
  password: string;
  organizacao_nome: string;
};

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

async function lerErro(resposta: Response, fallback: string): Promise<string> {
  const contentType = resposta.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = await resposta.json().catch(() => null);
    const detail = data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (Array.isArray(detail) && detail.length) return String(detail[0]);
    if (typeof data === "object" && data !== null) {
      const firstValue = Object.values(data)[0];
      if (typeof firstValue === "string" && firstValue.trim()) return firstValue;
      if (Array.isArray(firstValue) && firstValue.length) return String(firstValue[0]);
    }
  }

  const texto = (await resposta.text().catch(() => "")).trim();
  return texto || fallback;
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = obterTokenArmazenado();
  const organizacaoId = obterOrganizacaoIdArmazenado();

  if (token) {
    headers.set("Authorization", `Token ${token}`);
  }
  if (organizacaoId) {
    headers.set("X-Organizacao-Id", organizacaoId);
  }

  const resposta = await fetch(`${URL_API}${path}`, {
    ...init,
    headers,
  });

  if (resposta.status === 401) {
    limparSessaoLocal();
    notificarSessaoAlterada();
    throw new UnauthorizedError();
  }

  return resposta;
}

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
  const resposta = await apiFetch("/partidas", { cache: "no-store" });
  if (!resposta.ok) throw new Error("Falha ao carregar partidas");
  const dados = (await resposta.json()) as Partida[];
  return dados.map(normalizarUrlVideo);
}

export async function buscarPartida(partidaId: string): Promise<Partida> {
  const resposta = await apiFetch(`/partidas/${partidaId}`, { cache: "no-store" });
  if (!resposta.ok) throw new Error("Falha ao carregar partida");
  return normalizarUrlVideo(await resposta.json());
}

export async function listarEventosDaPartida(partidaId: string): Promise<Evento[]> {
  const resposta = await apiFetch(`/partidas/${partidaId}/eventos`, { cache: "no-store" });
  if (!resposta.ok) throw new Error("Falha ao carregar eventos");
  return resposta.json();
}

export async function listarEquipes(): Promise<Equipe[]> {
  const resposta = await apiFetch("/equipes", { cache: "no-store" });
  if (!resposta.ok) throw new Error("Falha ao carregar equipes");
  const dados = (await resposta.json()) as Equipe[];
  return dados.map(normalizarBrasao);
}

export async function listarJogadores(): Promise<Jogador[]> {
  const resposta = await apiFetch("/jogadores", { cache: "no-store" });
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

  const resposta = await apiFetch("/jogadores", {
    method: "POST",
    body: formData
  });

  if (!resposta.ok) {
    throw new Error(await lerErro(resposta, "Falha ao criar jogador"));
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

  const resposta = await apiFetch(`/jogadores/${jogadorId}`, {
    method: "PATCH",
    body: formData
  });

  if (!resposta.ok) {
    throw new Error(await lerErro(resposta, "Falha ao atualizar jogador"));
  }

  return normalizarFotoJogador(await resposta.json());
}

export async function criarAvaliacaoJogador(payload: PayloadAvaliacaoJogador): Promise<AvaliacaoJogador> {
  const resposta = await apiFetch("/avaliacoes-jogador", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!resposta.ok) {
    throw new Error(await lerErro(resposta, "Falha ao criar avaliacao do jogador"));
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

  const resposta = await apiFetch("/equipes", {
    method: "POST",
    body: formData
  });

  if (!resposta.ok) {
    throw new Error(await lerErro(resposta, "Falha ao criar equipe"));
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

  const resposta = await apiFetch(`/equipes/${equipeId}`, {
    method: "PATCH",
    body: formData
  });

  if (!resposta.ok) {
    throw new Error(await lerErro(resposta, "Falha ao atualizar equipe"));
  }

  return normalizarBrasao(await resposta.json());
}

export async function criarEvento(payload: Omit<Evento, "id" | "equipe_nome" | "jogador_nome">): Promise<Evento> {
  const resposta = await apiFetch("/eventos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!resposta.ok) {
    throw new Error(await lerErro(resposta, "Falha ao salvar evento"));
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
    resposta = await apiFetch("/partidas", {
      method: "POST",
      body: formData
    });
  } else {
    resposta = await apiFetch("/partidas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  if (!resposta.ok) {
    throw new Error(await lerErro(resposta, "Falha ao criar partida"));
  }

  return normalizarUrlVideo(await resposta.json());
}

export async function efetuarRegistro(payload: RegistroPayload): Promise<AuthPayload> {
  const resposta = await fetch(`${URL_API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resposta.ok) {
    throw new Error(await lerErro(resposta, "Falha ao criar conta."));
  }

  const dados = (await resposta.json()) as AuthPayload;
  salvarToken(dados.token);
  if (dados.organizacao_atual) {
    salvarOrganizacaoId(String(dados.organizacao_atual.id));
  }
  return dados;
}

export async function efetuarLogin(payload: LoginPayload): Promise<AuthPayload> {
  const resposta = await fetch(`${URL_API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resposta.ok) {
    throw new Error(await lerErro(resposta, "Falha ao entrar."));
  }

  const dados = (await resposta.json()) as AuthPayload;
  salvarToken(dados.token);
  if (dados.organizacao_atual) {
    salvarOrganizacaoId(String(dados.organizacao_atual.id));
  }
  return dados;
}

export async function buscarSessaoAtual(): Promise<AuthSessionPayload> {
  const resposta = await apiFetch("/auth/me", { cache: "no-store" });
  if (!resposta.ok) {
    throw new Error(await lerErro(resposta, "Falha ao carregar sessao."));
  }
  return resposta.json();
}

export async function efetuarLogout(): Promise<void> {
  const resposta = await apiFetch("/auth/logout", {
    method: "POST",
  });

  if (!resposta.ok && resposta.status !== 401) {
    throw new Error(await lerErro(resposta, "Falha ao encerrar sessao."));
  }

  limparSessaoLocal();
}
