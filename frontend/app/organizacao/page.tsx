"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import {
  ConviteOrganizacaoPayload,
  MembroOrganizacaoPayload,
  OrganizacaoAtualPayload,
  atualizarMembroOrganizacao,
  atualizarOrganizacaoAtual,
  cancelarConviteOrganizacao,
  buscarOrganizacaoAtual,
  criarConviteOrganizacao,
  listarConvitesOrganizacaoAtual,
  listarMembrosOrganizacaoAtual,
} from "@/lib/api";

const OPCOES_PAPEL = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "analista", label: "Analista" },
  { value: "viewer", label: "Viewer" },
];

function formatarData(valor: string | null) {
  if (!valor) return "-";
  return new Date(valor).toLocaleString("pt-BR");
}

export default function PaginaOrganizacao() {
  const { atualizarSessao, organizacaoAtual: organizacaoSessao, usuario } = useAuth();
  const [organizacao, setOrganizacao] = useState<OrganizacaoAtualPayload | null>(null);
  const [membros, setMembros] = useState<MembroOrganizacaoPayload[]>([]);
  const [convites, setConvites] = useState<ConviteOrganizacaoPayload[]>([]);
  const [nomeOrganizacao, setNomeOrganizacao] = useState("");
  const [emailConvite, setEmailConvite] = useState("");
  const [papelConvite, setPapelConvite] = useState("analista");
  const [carregando, setCarregando] = useState(true);
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [salvandoConvite, setSalvandoConvite] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!organizacaoSessao) return;

    const carregar = async () => {
      try {
        setCarregando(true);
        setErro(null);
        const [dadosOrganizacao, dadosMembros, dadosConvites] = await Promise.all([
          buscarOrganizacaoAtual(),
          listarMembrosOrganizacaoAtual(),
          listarConvitesOrganizacaoAtual(),
        ]);
        setOrganizacao(dadosOrganizacao);
        setNomeOrganizacao(dadosOrganizacao.nome);
        setMembros(dadosMembros);
        setConvites(dadosConvites);
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Falha ao carregar organizacao.");
      } finally {
        setCarregando(false);
      }
    };

    carregar();
  }, [organizacaoSessao?.id]);

  const podeGerir = Boolean(organizacao?.pode_gerir);

  const membrosAtivos = useMemo(() => membros.filter((item) => item.ativo), [membros]);

  const salvarNome = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!podeGerir) return;

    try {
      setSalvandoNome(true);
      setErro(null);
      setMensagem(null);
      const atualizado = await atualizarOrganizacaoAtual({ nome: nomeOrganizacao.trim() });
      setOrganizacao(atualizado);
      setNomeOrganizacao(atualizado.nome);
      await atualizarSessao();
      setMensagem("Organizacao atualizada.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao atualizar organizacao.");
    } finally {
      setSalvandoNome(false);
    }
  };

  const salvarMembro = async (membro: MembroOrganizacaoPayload, payload: { papel?: string; ativo?: boolean }) => {
    try {
      setErro(null);
      setMensagem(null);
      const atualizado = await atualizarMembroOrganizacao(membro.id, payload);
      setMembros((atual) => atual.map((item) => (item.id === atualizado.id ? atualizado : item)));
      await atualizarSessao();
      setMensagem("Membro atualizado.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao atualizar membro.");
    }
  };

  const criarConvite = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!podeGerir) return;

    try {
      setSalvandoConvite(true);
      setErro(null);
      setMensagem(null);
      const convite = await criarConviteOrganizacao({ email: emailConvite.trim(), papel: papelConvite });
      setConvites((atual) => [convite, ...atual]);
      setEmailConvite("");
      setPapelConvite("analista");
      setMensagem("Convite criado.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao criar convite.");
    } finally {
      setSalvandoConvite(false);
    }
  };

  const copiarLink = async (link: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        window.prompt("Copie o link do convite:", link);
      }
      setMensagem("Link do convite copiado.");
    } catch {
      setErro("Nao foi possivel copiar o link do convite.");
    }
  };

  const cancelarConvite = async (token: string) => {
    try {
      setErro(null);
      setMensagem(null);
      const atualizado = await cancelarConviteOrganizacao(token);
      setConvites((atual) => atual.map((item) => (item.token === atualizado.token ? atualizado : item)));
      setMensagem("Convite cancelado.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao cancelar convite.");
    }
  };

  if (carregando) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <p className="text-slate-300">Carregando organizacao...</p>
      </main>
    );
  }

  if (!organizacao) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <p className="rounded-2xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
          {erro || "Organizacao nao encontrada."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <section className="rounded-[28px] border border-slate-700/70 bg-panel p-6">
        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Workspace SaaS</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{organizacao.nome}</h1>
        <p className="mt-2 text-sm text-slate-300">
          Slug: {organizacao.slug} · Papel atual: {organizacao.papel_atual ?? "-"} · Status: {organizacao.status}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          {organizacao.total_membros} membro(s) ativo(s) · criado em {formatarData(organizacao.criado_em)}
        </p>

        {mensagem && <p className="mt-4 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">{mensagem}</p>}
        {erro && <p className="mt-4 rounded-2xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">{erro}</p>}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[28px] border border-slate-700/70 bg-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Configuracoes</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Organizacao atual</h2>
            </div>
          </div>

          <form onSubmit={salvarNome} className="mt-6 space-y-4">
            <label className="block text-sm text-slate-200">
              Nome da organizacao
              <input
                value={nomeOrganizacao}
                onChange={(evento) => setNomeOrganizacao(evento.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                disabled={!podeGerir || salvandoNome}
              />
            </label>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
              <p>Seu usuario atual: {usuario?.nome}</p>
              <p className="mt-1">Permissao de gestao: {organizacao.pode_gerir ? "sim" : "nao"}</p>
              <p className="mt-1">Permissao para editar scouting: {organizacao.pode_editar_conteudo ? "sim" : "nao"}</p>
            </div>

            {podeGerir ? (
              <button
                type="submit"
                disabled={salvandoNome || !nomeOrganizacao.trim()}
                className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-black disabled:opacity-60"
              >
                {salvandoNome ? "Salvando..." : "Salvar organizacao"}
              </button>
            ) : (
              <p className="text-sm text-slate-400">Somente admins e owners podem alterar os dados da organizacao.</p>
            )}
          </form>
        </section>

        <section className="rounded-[28px] border border-slate-700/70 bg-panel p-6">
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Membros</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Time dentro do workspace</h2>

          <div className="mt-6 space-y-3">
            {membrosAtivos.map((membro) => (
              <article key={membro.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-base font-semibold text-white">{membro.usuario.nome}</p>
                    <p className="text-sm text-slate-400">{membro.usuario.email}</p>
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <select
                      value={membro.papel}
                      onChange={(evento) => salvarMembro(membro, { papel: evento.target.value })}
                      disabled={!podeGerir}
                      className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200"
                    >
                      {OPCOES_PAPEL.map((opcao) => (
                        <option key={opcao.value} value={opcao.value}>
                          {opcao.label}
                        </option>
                      ))}
                    </select>

                    {membro.usuario.id !== usuario?.id && podeGerir && (
                      <button
                        type="button"
                        onClick={() => salvarMembro(membro, { ativo: false })}
                        className="rounded-full border border-red-500/40 px-3 py-2 text-sm text-red-200"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-[28px] border border-slate-700/70 bg-panel p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Convites</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Adicionar pessoas</h2>
            <p className="mt-2 text-sm text-slate-300">
              Gere links de convite com papel definido. O destinatario entra com a conta dele e aceita o convite.
            </p>
          </div>

          {podeGerir && (
            <form onSubmit={criarConvite} className="grid w-full gap-3 xl:max-w-xl xl:grid-cols-[1fr_180px_auto]">
              <input
                type="email"
                value={emailConvite}
                onChange={(evento) => setEmailConvite(evento.target.value)}
                placeholder="email@exemplo.com"
                className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                required
              />
              <select
                value={papelConvite}
                onChange={(evento) => setPapelConvite(evento.target.value)}
                className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
              >
                {OPCOES_PAPEL.filter((item) => item.value !== "owner").map((opcao) => (
                  <option key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={salvandoConvite}
                className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-black disabled:opacity-60"
              >
                {salvandoConvite ? "Criando..." : "Convidar"}
              </button>
            </form>
          )}
        </div>

        {!podeGerir && <p className="mt-4 text-sm text-slate-400">Somente admins e owners podem criar convites.</p>}

        <div className="mt-6 space-y-3">
          {convites.map((convite) => (
            <article key={convite.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-base font-semibold text-white">{convite.email}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Papel: {convite.papel} · Status: {convite.status} · Expira em {formatarData(convite.expira_em)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copiarLink(convite.link_convite)}
                    className="rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-200"
                  >
                    Copiar link
                  </button>
                  {podeGerir && convite.status === "pendente" && (
                    <button
                      type="button"
                      onClick={() => cancelarConvite(convite.token)}
                      className="rounded-full border border-red-500/40 px-3 py-2 text-sm text-red-200"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}

          {!convites.length && <p className="text-sm text-slate-400">Nenhum convite criado ainda.</p>}
        </div>
      </section>
    </main>
  );
}
