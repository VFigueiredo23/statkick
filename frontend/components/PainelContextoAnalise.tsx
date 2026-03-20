"use client";

import { Equipe, Jogador } from "@/lib/api";

import { ConfiguracaoEquipeAnalise } from "@/components/ModalConfiguracaoAnalise";

type PainelContextoAnaliseProps = {
  equipes: Equipe[];
  jogadores: Jogador[];
  configuracoes: ConfiguracaoEquipeAnalise[];
  equipeAtivaId: number | null;
  jogadorAtivoId: number | null;
  aoSelecionarEquipe: (equipeId: number) => void;
  aoSelecionarJogador: (jogadorId: number | null) => void;
  aoReconfigurar: () => void;
  salvandoEvento: boolean;
  feedback: string | null;
};

export default function PainelContextoAnalise({
  equipes,
  jogadores,
  configuracoes,
  equipeAtivaId,
  jogadorAtivoId,
  aoSelecionarEquipe,
  aoSelecionarJogador,
  aoReconfigurar,
  salvandoEvento,
  feedback
}: PainelContextoAnaliseProps) {
  const equipesAnalisadas = equipes.filter((equipe) => configuracoes.some((item) => item.equipeId === equipe.id && item.modo !== "nenhum"));
  const semFocoDefinido = !equipesAnalisadas.length || equipeAtivaId === null;
  const equipeAtiva = equipes.find((equipe) => equipe.id === equipeAtivaId) ?? null;
  const configuracaoAtiva = configuracoes.find((item) => item.equipeId === equipeAtivaId) ?? null;
  const jogadoresDaEquipeAtiva =
    configuracaoAtiva?.modo === "jogadores"
      ? jogadores.filter((jogador) => configuracaoAtiva.jogadoresSelecionados.includes(jogador.id))
      : [];

  const jogadorAtivo = jogadores.find((jogador) => jogador.id === jogadorAtivoId) ?? null;

  return (
    <section className="rounded-xl border border-slate-700 bg-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-300">Contexto da marcacao</h2>
          <p className="mt-1 text-sm text-slate-400">Selecione o alvo uma vez e clique nos eventos para salvar direto.</p>
        </div>
        <button type="button" className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-200" onClick={aoReconfigurar}>
          Reconfigurar foco
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {equipes.map((equipe) => {
          const configuracaoEquipe = configuracoes.find((item) => item.equipeId === equipe.id);
          if (configuracaoEquipe?.modo === "nenhum") {
            return (
              <div key={equipe.id} className="rounded-lg border border-dashed border-slate-800 px-3 py-3 text-left text-slate-500">
                <p className="text-xs uppercase tracking-wide">Fora do escopo</p>
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
              className={`rounded-lg border px-3 py-3 text-left transition ${
                ativa ? "border-accent bg-accent/15 text-white" : "border-slate-700 text-slate-300 hover:border-slate-500"
              }`}
              onClick={() => aoSelecionarEquipe(equipe.id)}
            >
              <p className="text-xs uppercase tracking-wide text-slate-400">Equipe ativa</p>
              <p className="mt-1 text-base font-semibold">{equipe.nome}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
        <p className="text-xs uppercase tracking-wide text-slate-400">Alvo atual</p>
        <p className="mt-1 text-sm text-slate-200">
          {semFocoDefinido ? "Sem foco definido" : `${equipeAtiva?.nome ?? "Equipe"} / ${jogadorAtivo ? jogadorAtivo.nome : "Equipe inteira"}`}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={semFocoDefinido}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              jogadorAtivoId === null ? "border-accent bg-accent/15 text-white" : "border-slate-700 text-slate-300 hover:border-slate-500"
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
                jogador.id === jogadorAtivoId ? "border-accent bg-accent/15 text-white" : "border-slate-700 text-slate-300 hover:border-slate-500"
              }`}
              onClick={() => aoSelecionarJogador(jogador.id)}
            >
              {jogador.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
          <p className="text-sm text-slate-200">
            {salvandoEvento
              ? "Salvando evento..."
              : feedback ?? (semFocoDefinido ? "Assistindo sem equipe configurada para analise." : "Pronto para marcacao rapida.")}
          </p>
        </div>
      </div>
    </section>
  );
}
