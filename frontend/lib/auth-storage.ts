export const CHAVE_TOKEN = "statkick_token";
export const CHAVE_ORGANIZACAO_ID = "statkick_organizacao_id";
export const EVENTO_SESSAO_ALTERADA = "statkick:sessao-alterada";

function estaNoNavegador() {
  return typeof window !== "undefined";
}

export function notificarSessaoAlterada() {
  if (!estaNoNavegador()) return;
  window.dispatchEvent(new Event(EVENTO_SESSAO_ALTERADA));
}

export function obterTokenArmazenado(): string | null {
  if (!estaNoNavegador()) return null;
  return window.localStorage.getItem(CHAVE_TOKEN);
}

export function salvarToken(token: string) {
  if (!estaNoNavegador()) return;
  window.localStorage.setItem(CHAVE_TOKEN, token);
}

export function limparToken() {
  if (!estaNoNavegador()) return;
  window.localStorage.removeItem(CHAVE_TOKEN);
}

export function obterOrganizacaoIdArmazenado(): string | null {
  if (!estaNoNavegador()) return null;
  return window.localStorage.getItem(CHAVE_ORGANIZACAO_ID);
}

export function salvarOrganizacaoId(organizacaoId: string) {
  if (!estaNoNavegador()) return;
  window.localStorage.setItem(CHAVE_ORGANIZACAO_ID, organizacaoId);
}

export function limparOrganizacaoId() {
  if (!estaNoNavegador()) return;
  window.localStorage.removeItem(CHAVE_ORGANIZACAO_ID);
}

export function limparSessaoLocal() {
  limparToken();
  limparOrganizacaoId();
}
