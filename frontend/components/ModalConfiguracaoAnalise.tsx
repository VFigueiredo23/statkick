"use client";

import { useEffect, useMemo, useState } from "react";

import { Equipe, Jogador } from "@/lib/api";

export type ConfiguracaoEquipeAnalise = {
  equipeId: number;
  modo: "nenhum" | "equipe" | "jogadores";
  jogadoresSelecionados: number[];
};

type ModalConfiguracaoAnaliseProps = {
  aberto: boolean;
  equipes: Equipe[];
  jogadores: Jogador[];
  configuracoes: ConfiguracaoEquipeAnalise[];
  podeEditarConteudo: boolean;
  aoCadastrarJogadorRapido: (payload: { equipeId: number; nome: string; posicao: string; idade: number }) => Promise<number>;
  aoCancelar: () => void;
  aoConfirmar: (configuracoes: ConfiguracaoEquipeAnalise[]) => void;
  aoPularAnalise: () => void;
};

function criarCopiaConfiguracoes(configuracoes: ConfiguracaoEquipeAnalise[]) {
  return configuracoes.map((item) => ({
    ...item,
    jogadoresSelecionados: [...item.jogadoresSelecionados]
  }));
}

export default function ModalConfiguracaoAnalise({
  aberto,
  equipes,
  jogadores,
  configuracoes,
  podeEditarConteudo,
  aoCadastrarJogadorRapido,
  aoCancelar,
  aoConfirmar,
  aoPularAnalise
}: ModalConfiguracaoAnaliseProps) {
  const [rascunho, setRascunho] = useState<ConfiguracaoEquipeAnalise[]>(() => criarCopiaConfiguracoes(configuracoes));
  const [erro, setErro] = useState<string | null>(null);
  const [formulariosRapidos, setFormulariosRapidos] = useState<Record<number, { nome: string; posicao: string; idade: string }>>({});
  const [salvandoRapidoEquipeId, setSalvandoRapidoEquipeId] = useState<number | null>(null);

  useEffect(() => {
    setRascunho(criarCopiaConfiguracoes(configuracoes));
    setErro(null);
  }, [configuracoes, aberto]);

  const jogadoresPorEquipe = useMemo(() => {
    return new Map(equipes.map((equipe) => [equipe.id, jogadores.filter((jogador) => jogador.equipe === equipe.id)]));
  }, [equipes, jogadores]);

  if (!aberto) return null;

  const atualizarModo = (equipeId: number, modo: "nenhum" | "equipe" | "jogadores") => {
    setRascunho((atual) =>
      atual.map((item) =>
        item.equipeId === equipeId
          ? {
              ...item,
              modo,
              jogadoresSelecionados: modo === "jogadores" ? item.jogadoresSelecionados : []
            }
          : item
      )
    );
  };

  const alternarJogador = (equipeId: number, jogadorId: number) => {
    setRascunho((atual) =>
      atual.map((item) => {
        if (item.equipeId !== equipeId) return item;
        const selecionado = item.jogadoresSelecionados.includes(jogadorId);
        return {
          ...item,
          jogadoresSelecionados: selecionado
            ? item.jogadoresSelecionados.filter((id) => id !== jogadorId)
            : [...item.jogadoresSelecionados, jogadorId]
        };
      })
    );
  };

  const atualizarFormularioRapido = (equipeId: number, campo: "nome" | "posicao" | "idade", valor: string) => {
    setFormulariosRapidos((atual) => ({
      ...atual,
      [equipeId]: {
        nome: atual[equipeId]?.nome ?? "",
        posicao: atual[equipeId]?.posicao ?? "",
        idade: atual[equipeId]?.idade ?? "",
        [campo]: valor
      }
    }));
  };

  const cadastrarJogadorRapido = async (equipeId: number) => {
    const formulario = formulariosRapidos[equipeId] ?? { nome: "", posicao: "", idade: "" };
    if (!formulario.nome.trim() || !formulario.posicao.trim() || !formulario.idade.trim()) {
      setErro("Preencha nome, posicao e idade para o cadastro rapido.");
      return;
    }
    if (Number.isNaN(Number(formulario.idade)) || Number(formulario.idade) <= 0) {
      setErro("Informe uma idade valida para o atleta.");
      return;
    }

    try {
      setErro(null);
      setSalvandoRapidoEquipeId(equipeId);
      const jogadorId = await aoCadastrarJogadorRapido({
        equipeId,
        nome: formulario.nome.trim(),
        posicao: formulario.posicao.trim(),
        idade: Number(formulario.idade)
      });
      setRascunho((atual) =>
        atual.map((item) =>
          item.equipeId === equipeId
            ? {
                ...item,
                modo: "jogadores",
                jogadoresSelecionados: [jogadorId]
              }
            : item
        )
      );
      setFormulariosRapidos((atual) => ({
        ...atual,
        [equipeId]: { nome: "", posicao: "", idade: "" }
      }));
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao cadastrar atleta rapidamente.");
    } finally {
      setSalvandoRapidoEquipeId(null);
    }
  };

  const confirmar = () => {
    const invalida = rascunho.find((item) => item.modo === "jogadores" && item.jogadoresSelecionados.length === 0);
    if (invalida) {
      const equipe = equipes.find((item) => item.id === invalida.equipeId);
      setErro(`Selecione pelo menos um atleta para ${equipe?.nome ?? "a equipe"}.`);
      return;
    }

    aoConfirmar(criarCopiaConfiguracoes(rascunho));
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Modo de analise</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Defina quem sera acompanhado nesta partida</h2>
          <p className="mt-2 text-sm text-slate-300">
            Escolha se voce vai analisar a equipe inteira ou apenas atletas especificos. Isso sera usado para marcar eventos mais rapido.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {equipes.map((equipe) => {
            const configuracaoEquipe = rascunho.find((item) => item.equipeId === equipe.id);
            if (!configuracaoEquipe) return null;

            const jogadoresDaEquipe = jogadoresPorEquipe.get(equipe.id) ?? [];

            return (
              <section key={equipe.id} className="rounded-xl border border-slate-700 bg-panel p-4">
                <h3 className="text-lg font-semibold text-white">{equipe.nome}</h3>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    className={`rounded-lg border px-3 py-3 text-left text-sm transition sm:col-span-2 ${
                      configuracaoEquipe.modo === "nenhum"
                        ? "border-accent bg-accent/15 text-white"
                        : "border-slate-700 text-slate-300 hover:border-slate-500"
                    }`}
                    onClick={() => atualizarModo(equipe.id, "nenhum")}
                  >
                    <p className="font-semibold">Nao analisar</p>
                    <p className="mt-1 text-xs text-slate-400">Ignora essa equipe na marcacao rapida desta partida.</p>
                  </button>

                  <button
                    type="button"
                    className={`rounded-lg border px-3 py-3 text-left text-sm transition ${
                      configuracaoEquipe.modo === "equipe"
                        ? "border-accent bg-accent/15 text-white"
                        : "border-slate-700 text-slate-300 hover:border-slate-500"
                    }`}
                    onClick={() => atualizarModo(equipe.id, "equipe")}
                  >
                    <p className="font-semibold">Equipe inteira</p>
                    <p className="mt-1 text-xs text-slate-400">Eventos podem ser marcados para o time sem limitar atletas.</p>
                  </button>

                  <button
                    type="button"
                    className={`rounded-lg border px-3 py-3 text-left text-sm transition ${
                      configuracaoEquipe.modo === "jogadores"
                        ? "border-accent bg-accent/15 text-white"
                        : "border-slate-700 text-slate-300 hover:border-slate-500"
                    }`}
                    onClick={() => atualizarModo(equipe.id, "jogadores")}
                  >
                    <p className="font-semibold">Atletas especificos</p>
                    <p className="mt-1 text-xs text-slate-400">Mostra so os jogadores escolhidos na marcacao rapida.</p>
                  </button>
                </div>

                {configuracaoEquipe.modo === "jogadores" && (
                  <div className="mt-4 max-h-64 space-y-2 overflow-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                    {jogadoresDaEquipe.map((jogador) => {
                      const selecionado = configuracaoEquipe.jogadoresSelecionados.includes(jogador.id);

                      return (
                        <label
                          key={jogador.id}
                          className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                            selecionado
                              ? "border-accent bg-accent/10 text-white"
                              : "border-slate-800 text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          <span>{jogador.nome}</span>
                          <input
                            type="checkbox"
                            checked={selecionado}
                            onChange={() => alternarJogador(equipe.id, jogador.id)}
                          />
                        </label>
                      );
                    })}
                    {!jogadoresDaEquipe.length && (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-400">Nenhum jogador cadastrado para essa equipe.</p>

                        {podeEditarConteudo ? (
                          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                            <p className="text-sm font-medium text-white">Cadastro rapido para esta analise</p>
                            <div className="mt-3 grid gap-2 md:grid-cols-3">
                              <input
                                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                                placeholder="Nome do atleta"
                                value={formulariosRapidos[equipe.id]?.nome ?? ""}
                                onChange={(evento) => atualizarFormularioRapido(equipe.id, "nome", evento.target.value)}
                              />
                              <input
                                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                                placeholder="Posicao"
                                value={formulariosRapidos[equipe.id]?.posicao ?? ""}
                                onChange={(evento) => atualizarFormularioRapido(equipe.id, "posicao", evento.target.value)}
                              />
                              <input
                                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                                placeholder="Idade"
                                inputMode="numeric"
                                value={formulariosRapidos[equipe.id]?.idade ?? ""}
                                onChange={(evento) => atualizarFormularioRapido(equipe.id, "idade", evento.target.value)}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => cadastrarJogadorRapido(equipe.id)}
                              disabled={salvandoRapidoEquipeId === equipe.id}
                              className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
                            >
                              {salvandoRapidoEquipeId === equipe.id ? "Cadastrando..." : "Cadastrar atleta agora"}
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">Seu papel atual nao permite cadastrar atleta neste ponto.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {erro && <p className="mt-4 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">{erro}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200" onClick={aoCancelar}>
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-500 px-4 py-2 text-sm text-slate-200"
            onClick={aoPularAnalise}
          >
            Nao analisar agora
          </button>
          <button type="button" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black" onClick={confirmar}>
            Comecar analise
          </button>
        </div>
      </div>
    </div>
  );
}
