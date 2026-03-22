"use client";

const GRUPOS_EVENTO = [
  {
    titulo: "Construcao",
    descricao: "Posse e criacao",
    eventos: ["Passe", "Passe chave", "Cruzamento", "Assistencia"],
  },
  {
    titulo: "Acoes Individuais",
    descricao: "Ruptura e duelo",
    eventos: ["Drible", "Finalizacao", "Perda de bola", "Erro de passe"],
  },
  {
    titulo: "Fase Defensiva",
    descricao: "Recuperacao e pressao",
    eventos: ["Desarme", "Interceptacao", "Recuperacao", "Pressao", "Bloqueio", "Falta"],
  },
] as const;

type BarraEventosProps = {
  aoSelecionarEvento: (tipoEvento: string) => void;
  desabilitado?: boolean;
};

export default function BarraEventos({ aoSelecionarEvento, desabilitado = false }: BarraEventosProps) {
  return (
    <aside className="rounded-[28px] border border-slate-700/70 bg-panel p-4 shadow-[0_14px_40px_rgba(2,6,23,0.22)]">
      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Marcacao Rapida</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Eventos do analista</h2>
        <p className="mt-1 text-sm text-slate-400">Escolha o alvo uma vez e clique no evento para registrar o lance.</p>
      </div>

      <div className="space-y-4">
        {GRUPOS_EVENTO.map((grupo) => (
          <section key={grupo.titulo} className="rounded-2xl border border-slate-800 bg-slate-950/35 p-3">
            <div className="mb-3">
              <p className="text-sm font-semibold text-white">{grupo.titulo}</p>
              <p className="text-xs text-slate-500">{grupo.descricao}</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {grupo.eventos.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  disabled={desabilitado}
                  className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-left text-sm font-medium text-slate-200 transition hover:border-accent hover:bg-accent/10 hover:text-white disabled:opacity-50"
                  onClick={() => aoSelecionarEvento(tipo)}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
