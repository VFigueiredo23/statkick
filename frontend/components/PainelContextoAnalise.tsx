"use client";

import { useEffect, useState } from "react";

import { EVENTO_ATALHO_MAPA } from "@/lib/atalhos-analise";
import { Equipe, Jogador } from "@/lib/api";

import { ConfiguracaoEquipeAnalise } from "@/components/ModalConfiguracaoAnalise";

const ACOES_ZONA = ["Passe", "Passe chave", "Drible", "Finalizacao", "Cruzamento", "Recuperacao", "Desarme", "Pressao"];

type PainelContextoAnaliseProps = {
  equipes: Equipe[];
  jogadores: Jogador[];
  configuracoes: ConfiguracaoEquipeAnalise[];
  equipeAtivaId: number | null;
  jogadorAtivoId: number | null;
  zonaAtual: { x: number; y: number } | null;
  aoSelecionarEquipe: (equipeId: number) => void;
  aoSelecionarJogador: (jogadorId: number | null) => void;
  aoMarcarEventoNaZona: (tipoEvento: string) => void;
  aoReconfigurar: () => void;
  salvandoEvento: boolean;
  feedback: string | null;
  podeEditarConteudo: boolean;
};

export default function PainelContextoAnalise({
  equipes,
  jogadores,
  configuracoes,
  equipeAtivaId,
  jogadorAtivoId,
  zonaAtual,
  aoSelecionarEquipe,
  aoSelecionarJogador,
  aoMarcarEventoNaZona,
  aoReconfigurar,
  salvandoEvento,
  feedback,
  podeEditarConteudo
}: PainelContextoAnaliseProps) {
  const [zonaExpandida, setZonaExpandida] = useState(false);
  const equipesAnalisadas = equipes.filter((equipe) => configuracoes.some((item) => item.equipeId === equipe.id && item.modo !== "nenhum"));
  const semFocoDefinido = !equipesAnalisadas.length || equipeAtivaId === null;
  const equipeAtiva = equipes.find((equipe) => equipe.id === equipeAtivaId) ?? null;
  const configuracaoAtiva = configuracoes.find((item) => item.equipeId === equipeAtivaId) ?? null;
  const jogadoresDaEquipeAtiva =
    configuracaoAtiva?.modo === "jogadores"
      ? jogadores.filter((jogador) => configuracaoAtiva.jogadoresSelecionados.includes(jogador.id))
      : [];

  const jogadorAtivo = jogadores.find((jogador) => jogador.id === jogadorAtivoId) ?? null;
  const zonaRotulo = zonaAtual ? `${Math.round(zonaAtual.x)}% x ${Math.round(zonaAtual.y)}%` : "Clique no campo para marcar a zona.";

  useEffect(() => {
    setZonaExpandida(Boolean(zonaAtual));
  }, [zonaAtual]);

  return (
    <section className="rounded-[28px] border border-slate-700/70 bg-panel p-4 shadow-[0_14px_40px_rgba(2,6,23,0.22)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Centro de Controle</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Zona atual da jogada</h2>
          <p className="mt-1 text-sm text-slate-400">Clique no campo, abra a zona e dispare a acao do lance sem sair do fluxo.</p>
        </div>
        <button
          type="button"
          className="rounded-2xl border border-slate-600 bg-slate-950/40 px-3 py-2 text-xs font-medium text-slate-100"
          onClick={aoReconfigurar}
        >
          Reconfigurar
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/35 p-3">
        <button
          type="button"
          disabled={!zonaAtual}
          onClick={() => {
            if (!zonaAtual) return;
            setZonaExpandida((atual) => !atual);
          }}
          className={`w-full rounded-2xl border px-4 py-4 text-left ${
            zonaAtual
              ? "border-accent/40 bg-accent/10"
              : "border-slate-800 bg-slate-950/35"
          } ${!zonaAtual ? "cursor-default" : ""}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Zona selecionada</p>
              <p className="mt-2 text-base font-semibold text-white">{zonaRotulo}</p>
              <p className="mt-1 text-sm text-slate-400">
                {zonaAtual
                  ? "Clique neste bloco para abrir as acoes rapidas da jogada."
                  : "Primeiro clique no campo da analise espacial para definir a zona."}
              </p>
            </div>
            {zonaAtual && (
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-accent">
                {zonaExpandida ? "Fechar" : "Abrir"}
              </span>
            )}
          </div>
        </button>

        {zonaExpandida && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {ACOES_ZONA.map((acao) => (
              <button
                key={acao}
                type="button"
                disabled={!zonaAtual || !podeEditarConteudo || semFocoDefinido || salvandoEvento}
                onClick={() => aoMarcarEventoNaZona(acao)}
                className="rounded-xl border border-slate-700 bg-slate-950/55 px-3 py-2 text-left text-sm font-medium text-slate-200 transition hover:border-accent hover:bg-accent/10 hover:text-white disabled:opacity-45"
              >
                <span className="flex items-center justify-between gap-3">
                  <span>{acao}</span>
                  {EVENTO_ATALHO_MAPA[acao] && (
                    <span className="rounded-md border border-slate-700 bg-slate-900/70 px-2 py-0.5 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                      {EVENTO_ATALHO_MAPA[acao]}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/45 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Escopo</p>
            <p className="mt-2 text-sm font-medium text-white">{equipesAnalisadas.length ? `${equipesAnalisadas.length} equipe(s)` : "Sem escopo"}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/45 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Alvo</p>
            <p className="mt-2 text-sm font-medium text-white">{jogadorAtivo ? jogadorAtivo.nome : equipeAtiva?.nome ?? "Sem foco"}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/45 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Status</p>
            <p className="mt-2 text-sm font-medium text-white">
              {salvandoEvento ? "Salvando evento..." : feedback ?? (semFocoDefinido ? "Modo observacao" : "Pronto para marcar")}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/45 px-3 py-2">
          <p className="text-sm text-slate-300">
            {semFocoDefinido
              ? "Defina equipe ou jogador antes de usar a zona como atalho de marcacao."
              : zonaAtual
                ? feedback ?? "Zona pronta para disparo rapido do evento."
                : "Marque uma zona no campo para abrir o seletor rapido."}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {equipes.map((equipe) => {
          const configuracaoEquipe = configuracoes.find((item) => item.equipeId === equipe.id);
          if (configuracaoEquipe?.modo === "nenhum") {
            return (
              <div key={equipe.id} className="rounded-2xl border border-dashed border-slate-800 px-3 py-3 text-left text-slate-500">
                <p className="text-[11px] uppercase tracking-[0.3em]">Fora do escopo</p>
                <p className="mt-1 text-base font-semibold">{equipe.nome}</p>
              </div>
            );
          }

          const ativa = equipe.id === equipeAtivaId;
          return (
            <button
              key={equipe.id}
              type="button"
              disabled={semFocoDefinido}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                ativa
                  ? "border-accent bg-[linear-gradient(135deg,rgba(34,197,94,0.18),rgba(15,23,42,0.4))] text-white shadow-[0_10px_30px_rgba(34,197,94,0.12)]"
                  : "border-slate-700 bg-slate-950/35 text-slate-300 hover:border-slate-500"
              }`}
              onClick={() => aoSelecionarEquipe(equipe.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">{ativa ? "Equipe em foco" : "Equipe habilitada"}</p>
                  <p className="mt-1 text-base font-semibold">{equipe.nome}</p>
                </div>
                {ativa && <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">Ativa</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Selecao fina</p>
        <p className="mt-2 text-sm text-slate-200">
          {semFocoDefinido ? "Sem foco definido" : `${equipeAtiva?.nome ?? "Equipe"} / ${jogadorAtivo ? jogadorAtivo.nome : "Equipe inteira"}`}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={semFocoDefinido}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              jogadorAtivoId === null
                ? "border-accent bg-accent/15 text-white"
                : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-slate-500"
            }`}
            onClick={() => aoSelecionarJogador(null)}
          >
            Equipe inteira
          </button>

          {jogadoresDaEquipeAtiva.map((jogador) => (
            <button
              key={jogador.id}
              type="button"
              disabled={semFocoDefinido}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                jogador.id === jogadorAtivoId
                  ? "border-accent bg-accent/15 text-white"
                  : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-slate-500"
              }`}
              onClick={() => aoSelecionarJogador(jogador.id)}
            >
              {jogador.nome}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
