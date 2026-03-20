"use client";

const TIPOS_EVENTO = [
  "Passe",
  "Passe chave",
  "Finalizacao",
  "Cruzamento",
  "Drible",
  "Assistencia",
  "Desarme",
  "Interceptacao",
  "Recuperacao",
  "Pressao",
  "Bloqueio",
  "Perda de bola",
  "Erro de passe",
  "Falta"
];

type BarraEventosProps = {
  aoSelecionarEvento: (tipoEvento: string) => void;
};

export default function BarraEventos({ aoSelecionarEvento }: BarraEventosProps) {
  return (
    <aside className="rounded-xl border border-slate-700 bg-panel p-4">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-300">Eventos</h2>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        {TIPOS_EVENTO.map((tipo) => (
          <button
            key={tipo}
            className="rounded border border-slate-600 px-3 py-2 text-left text-sm text-slate-200 transition hover:border-accent hover:text-accent"
            onClick={() => aoSelecionarEvento(tipo)}
          >
            {tipo}
          </button>
        ))}
      </div>
    </aside>
  );
}
