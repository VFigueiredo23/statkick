"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  AuthPayload,
  AuthSessionPayload,
  LoginPayload,
  OrganizacaoResumo,
  RegistroPayload,
  UsuarioLogado,
  buscarSessaoAtual,
  efetuarLogin,
  efetuarLogout,
  efetuarRegistro,
} from "@/lib/api";
import {
  EVENTO_SESSAO_ALTERADA,
  limparSessaoLocal,
  obterOrganizacaoIdArmazenado,
  obterTokenArmazenado,
  salvarOrganizacaoId,
} from "@/lib/auth-storage";

type AuthContextValue = {
  carregando: boolean;
  autenticado: boolean;
  token: string | null;
  usuario: UsuarioLogado | null;
  organizacoes: OrganizacaoResumo[];
  organizacaoAtual: OrganizacaoResumo | null;
  entrar: (payload: LoginPayload) => Promise<void>;
  registrar: (payload: RegistroPayload) => Promise<void>;
  sair: () => Promise<void>;
  atualizarSessao: () => Promise<void>;
  selecionarOrganizacao: (organizacaoId: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function aplicarSessao(dados: AuthPayload | AuthSessionPayload, tokenAtual: string | null) {
  const organizacaoSalva = obterOrganizacaoIdArmazenado();
  const organizacaoAtual =
    dados.organizacoes.find((item) => String(item.id) === organizacaoSalva) ?? dados.organizacao_atual ?? dados.organizacoes[0] ?? null;

  if (organizacaoAtual) {
    salvarOrganizacaoId(String(organizacaoAtual.id));
  }

  return {
    token: tokenAtual,
    usuario: dados.usuario,
    organizacoes: dados.organizacoes,
    organizacaoAtual,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [organizacoes, setOrganizacoes] = useState<OrganizacaoResumo[]>([]);
  const [organizacaoAtual, setOrganizacaoAtual] = useState<OrganizacaoResumo | null>(null);

  const limparEstadoSessao = () => {
    setToken(null);
    setUsuario(null);
    setOrganizacoes([]);
    setOrganizacaoAtual(null);
  };

  const aplicarPayload = (dados: AuthPayload | AuthSessionPayload, tokenAtual: string | null) => {
    const sessao = aplicarSessao(dados, tokenAtual);
    setToken(sessao.token);
    setUsuario(sessao.usuario);
    setOrganizacoes(sessao.organizacoes);
    setOrganizacaoAtual(sessao.organizacaoAtual);
  };

  const atualizarSessao = async () => {
    const tokenAtual = obterTokenArmazenado();
    if (!tokenAtual) {
      limparSessaoLocal();
      limparEstadoSessao();
      setCarregando(false);
      return;
    }

    try {
      const dados = await buscarSessaoAtual();
      aplicarPayload(dados, tokenAtual);
    } catch {
      limparSessaoLocal();
      limparEstadoSessao();
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    setToken(obterTokenArmazenado());
    atualizarSessao();
  }, []);

  useEffect(() => {
    const sincronizarSessao = () => {
      setCarregando(true);
      atualizarSessao();
    };

    window.addEventListener(EVENTO_SESSAO_ALTERADA, sincronizarSessao);
    window.addEventListener("storage", sincronizarSessao);

    return () => {
      window.removeEventListener(EVENTO_SESSAO_ALTERADA, sincronizarSessao);
      window.removeEventListener("storage", sincronizarSessao);
    };
  }, []);

  const entrar = async (payload: LoginPayload) => {
    const dados = await efetuarLogin(payload);
    aplicarPayload(dados, dados.token);
  };

  const registrar = async (payload: RegistroPayload) => {
    const dados = await efetuarRegistro(payload);
    aplicarPayload(dados, dados.token);
  };

  const sair = async () => {
    try {
      await efetuarLogout();
    } finally {
      limparSessaoLocal();
      limparEstadoSessao();
    }
  };

  const selecionarOrganizacao = (organizacaoId: string) => {
    salvarOrganizacaoId(organizacaoId);
    setOrganizacaoAtual(organizacoes.find((item) => String(item.id) === organizacaoId) ?? null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      carregando,
      autenticado: Boolean(token && usuario),
      token,
      usuario,
      organizacoes,
      organizacaoAtual,
      entrar,
      registrar,
      sair,
      atualizarSessao,
      selecionarOrganizacao,
    }),
    [carregando, token, usuario, organizacoes, organizacaoAtual]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth precisa ser usado dentro de AuthProvider.");
  }
  return context;
}
