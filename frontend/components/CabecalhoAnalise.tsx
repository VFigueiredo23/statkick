type CabecalhoAnaliseProps = {
  equipeCasa: string;
  equipeFora: string;
  competicao: string;
  tempoJogo: string;
};

export default function CabecalhoAnalise({ equipeCasa, equipeFora, competicao, tempoJogo }: CabecalhoAnaliseProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-700 bg-panel px-4 py-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">Competicao</p>
        <h1 className="text-lg font-semibold text-white">{competicao}</h1>
      </div>
      <div className="text-center">
        <p className="text-sm text-slate-400">Confronto</p>
        <p className="text-xl font-bold text-white">{equipeCasa} x {equipeFora}</p>
      </div>
      <div className="text-right">
        <p className="text-xs uppercase tracking-wide text-slate-400">Tempo do jogo</p>
        <p className="font-mono text-2xl font-bold text-accent">{tempoJogo}</p>
      </div>
    </header>
  );
}
