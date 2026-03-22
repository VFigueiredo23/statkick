import { Evento } from "@/lib/api";

type LinhaTempoEventosProps = {
  eventos: Evento[];
};

function formatarRelogio(minuto: number, segundo: number): string {
  return `${minuto.toString().padStart(2, "0")}:${segundo.toString().padStart(2, "0")}`;
}

export default function LinhaTempoEventos({ eventos }: LinhaTempoEventosProps) {
  return (
    <section className="rounded-[28px] border border-slate-700/70 bg-panel p-5 shadow-[0_14px_40px_rgba(2,6,23,0.22)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Linha do Tempo</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Leitura cronologica da partida</h2>
          <p className="mt-1 text-sm text-slate-400">Os lances mais recentes aparecem primeiro para apoiar a revisao rapida.</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Volume</p>
          <p className="mt-2 text-2xl font-semibold text-white">{eventos.length}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {[...eventos]
          .sort((a, b) => {
            const tempoA = a.minuto * 60 + a.segundo;
            const tempoB = b.minuto * 60 + b.segundo;
            return tempoB - tempoA;
          })
          .map((evento) => (
            <article key={evento.id} className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="min-w-[72px] rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-center font-mono text-lg font-semibold text-accent">
                    {formatarRelogio(evento.minuto, evento.segundo)}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">{evento.tipo_evento}</p>
                    <p className="mt-1 text-sm text-slate-300">
                      {evento.jogador_nome || "Equipe inteira"} · {evento.equipe_nome || "Sem equipe"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-slate-300">
                    {evento.equipe_nome || "Sem equipe"}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1.5 ${
                      evento.posicao_x !== null && evento.posicao_x !== undefined && evento.posicao_y !== null && evento.posicao_y !== undefined
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                        : "border-slate-700 bg-slate-900/70 text-slate-400"
                    }`}
                  >
                    {evento.posicao_x !== null && evento.posicao_x !== undefined && evento.posicao_y !== null && evento.posicao_y !== undefined
                      ? "Com zona"
                      : "Sem zona"}
                  </span>
                </div>
              </div>
            </article>
          ))}

        {!eventos.length && (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 px-4 py-6 text-center text-sm text-slate-400">
            Nenhum evento marcado ainda.
          </div>
        )}
      </div>
    </section>
  );
}
