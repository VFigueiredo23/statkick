type CabecalhoAnaliseProps = {
  equipeCasa: string;
  equipeFora: string;
  competicao: string;
  tempoJogo: string;
  totalEventos: number;
  focoAtual: string;
  zonaAtual?: string | null;
  aoReconfigurar: () => void;
};

export default function CabecalhoAnalise({
  equipeCasa,
  equipeFora,
  competicao,
  tempoJogo,
  totalEventos,
  focoAtual,
  zonaAtual,
  aoReconfigurar,
}: CabecalhoAnaliseProps) {
  return (
    <header className="overflow-hidden rounded-[28px] border border-slate-700/70 bg-[linear-gradient(135deg,rgba(17,24,39,0.98),rgba(8,15,28,0.96))] shadow-[0_18px_60px_rgba(2,6,23,0.45)]">
      <div className="flex flex-col gap-6 px-5 py-5 lg:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.38em] text-slate-400">Sala de Analise</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-white">{equipeCasa} x {equipeFora}</h1>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                {competicao}
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">
              Operacao de scouting ao vivo com foco, zona de jogada, quadro tatico e linha do tempo de eventos.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Relogio</p>
              <p className="mt-2 font-mono text-3xl font-semibold text-accent">{tempoJogo}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Foco Atual</p>
              <p className="mt-2 text-sm font-medium text-white">{focoAtual}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Eventos</p>
              <p className="mt-2 text-2xl font-semibold text-white">{totalEventos}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3 text-sm text-slate-300">
            <span className="rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1.5">Alvo: {focoAtual}</span>
            <span className="rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1.5">
              Zona: {zonaAtual || "Nao definida"}
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1.5">
              Fluxo: video + eventos + heatmap
            </span>
          </div>

          <button
            type="button"
            onClick={aoReconfigurar}
            className="rounded-2xl border border-slate-600 bg-slate-950/40 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-400"
          >
            Reconfigurar foco da partida
          </button>
        </div>
      </div>
    </header>
  );
}
