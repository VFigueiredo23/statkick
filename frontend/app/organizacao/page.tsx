"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import { rotuloPapel, rotuloPlano } from "@/lib/papeis";
import {
  AuditLogPayload,
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
  listarAuditoriaOrganizacaoAtual,
} from "@/lib/api";

const OPCOES_PAPEL = [
  { value: "owner", label: "Proprietario" },
  { value: "admin", label: "Administrador" },
  { value: "analista", label: "Analista" },
  { value: "viewer", label: "Visualizador" },
];

function formatarData(valor: string | null) {
  if (!valor) return "-";
  return new Date(valor).toLocaleString("pt-BR");
}

function formatarBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

function BarraUso({ percentual }: { percentual: number }) {
  const classe =
    percentual >= 90 ? "bg-red-400" : percentual >= 75 ? "bg-amber-400" : "bg-accent";

  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
      <div className={`h-full rounded-full ${classe}`} style={{ width: `${Math.min(percentual, 100)}%` }} />
    </div>
  );
}

export default function PaginaOrganizacao() {
  const { atualizarSessao, organizacaoAtual: organizacaoSessao, usuario } = useAuth();
  const [organizacao, setOrganizacao] = useState<OrganizacaoAtualPayload | null>(null);
  const [membros, setMembros] = useState<MembroOrganizacaoPayload[]>([]);
  const [convites, setConvites] = useState<ConviteOrganizacaoPayload[]>([]);
  const [auditoria, setAuditoria] = useState<AuditLogPayload[]>([]);
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
        const [dadosOrganizacao, dadosMembros, dadosConvites, dadosAuditoria] = await Promise.all([
          buscarOrganizacaoAtual(),
          listarMembrosOrganizacaoAtual(),
          listarConvitesOrganizacaoAtual(),
          listarAuditoriaOrganizacaoAtual(),
        ]);
        setOrganizacao(dadosOrganizacao);
        setNomeOrganizacao(dadosOrganizacao.nome);
        setMembros(dadosMembros);
        setConvites(dadosConvites);
        setAuditoria(dadosAuditoria);
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
  const cardsUso = organizacao
    ? [
        {
          id: "membros",
          titulo: "Membros",
          valor: `${organizacao.uso.membros.utilizado}/${organizacao.uso.membros.limite}`,
          detalhe: `${organizacao.uso.convites_pendentes} convite(s) pendente(s)`,
          percentual: organizacao.uso.membros.percentual,
        },
        {
          id: "equipes",
          titulo: "Equipes",
          valor: `${organizacao.uso.equipes.utilizado}/${organizacao.uso.equipes.limite}`,
          detalhe: `${organizacao.uso.equipes.restante} restante(s)`,
          percentual: organizacao.uso.equipes.percentual,
        },
        {
          id: "jogadores",
          titulo: "Jogadores",
          valor: `${organizacao.uso.jogadores.utilizado}/${organizacao.uso.jogadores.limite}`,
          detalhe: `${organizacao.uso.jogadores.restante} restante(s)`,
          percentual: organizacao.uso.jogadores.percentual,
        },
        {
          id: "partidas",
          titulo: "Partidas",
          valor: `${organizacao.uso.partidas.utilizado}/${organizacao.uso.partidas.limite}`,
          detalhe: `${organizacao.uso.partidas.restante} restante(s)`,
          percentual: organizacao.uso.partidas.percentual,
        },
        {
          id: "armazenamento",
          titulo: "Armazenamento de videos",
          valor: `${formatarBytes(organizacao.uso.armazenamento.utilizado)} / ${formatarBytes(organizacao.limite_armazenamento_bytes)}`,
          detalhe: `${formatarBytes(organizacao.uso.armazenamento.restante)} livre`,
          percentual: organizacao.uso.armazenamento.percentual,
        },
      ]
    : [];

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
      setAuditoria(await listarAuditoriaOrganizacaoAtual());
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
      setAuditoria(await listarAuditoriaOrganizacaoAtual());
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
      setAuditoria(await listarAuditoriaOrganizacaoAtual());
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
      setAuditoria(await listarAuditoriaOrganizacaoAtual());
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
          {rotuloPlano(organizacao.plano)} · Slug: {organizacao.slug} · Papel atual: {rotuloPapel(organizacao.papel_atual)} · Status: {organizacao.status}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          {organizacao.total_membros} membro(s) ativo(s) · criado em {formatarData(organizacao.criado_em)}
        </p>

        {mensagem && <p className="mt-4 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">{mensagem}</p>}
        {erro && <p className="mt-4 rounded-2xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">{erro}</p>}
      </section>

      <section className="mt-6 rounded-[28px] border border-slate-700/70 bg-panel p-6">
        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Atividade</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Historico recente do workspace</h2>

        <div className="mt-6 space-y-3">
          {auditoria.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{item.descricao || item.acao}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {item.usuario?.nome ?? "Sistema"} · {formatarData(item.criado_em)}
                  </p>
                </div>
                <div className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{item.acao}</div>
              </div>
            </article>
          ))}

          {!auditoria.length && <p className="text-sm text-slate-400">Nenhuma atividade registrada ainda.</p>}
        </div>
      </section>

      <section className="mt-6 rounded-[28px] border border-slate-700/70 bg-panel p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Plano e consumo</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Limites do workspace</h2>
          </div>
          <p className="text-sm text-slate-400">
            Onboarding: {organizacao.uso.onboarding.concluidos}/{organizacao.uso.onboarding.total} etapa(s)
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {cardsUso.map((card) => (
            <article key={card.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">{card.titulo}</p>
              <p className="mt-3 text-xl font-semibold text-white">{card.valor}</p>
              <p className="mt-2 text-sm text-slate-400">{card.detalhe}</p>
              <BarraUso percentual={card.percentual} />
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-sm font-semibold text-white">Checklist de ativacao</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {organizacao.uso.onboarding.etapas.map((etapa) => (
              <div
                key={etapa.id}
                className={`rounded-2xl border p-4 ${etapa.concluido ? "border-accent/40 bg-accent/10" : "border-slate-800 bg-slate-950/60"}`}
              >
                <p className="text-sm font-semibold text-white">
                  {etapa.concluido ? "Concluido" : "Pendente"} · {etapa.titulo}
                </p>
                <p className="mt-2 text-sm text-slate-300">{etapa.descricao}</p>
              </div>
            ))}
          </div>
        </div>
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
              <p className="text-sm text-slate-400">Somente administradores e proprietarios podem alterar os dados da organizacao.</p>
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

        {!podeGerir && <p className="mt-4 text-sm text-slate-400">Somente administradores e proprietarios podem criar convites.</p>}

        <div className="mt-6 space-y-3">
          {convites.map((convite) => (
            <article key={convite.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-base font-semibold text-white">{convite.email}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Papel: {rotuloPapel(convite.papel)} · Status: {convite.status} · Expira em {formatarData(convite.expira_em)}
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
