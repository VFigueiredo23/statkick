import { Evento } from "@/lib/api";

type LinhaTempoEventosProps = {
  eventos: Evento[];
};

function formatarRelogio(minuto: number, segundo: number): string {
  return `${minuto.toString().padStart(2, "0")}:${segundo.toString().padStart(2, "0")}`;
}

export default function LinhaTempoEventos({ eventos }: LinhaTempoEventosProps) {
  return (
    <section className="rounded-xl border border-slate-700 bg-panel p-4">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-300">Timeline</h2>
      <div className="max-h-56 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="pb-2">Tempo</th>
              <th className="pb-2">Jogador</th>
              <th className="pb-2">Evento</th>
              <th className="pb-2">Equipe</th>
              <th className="pb-2">Mapa</th>
            </tr>
          </thead>
          <tbody>
            {eventos.map((evento) => (
              <tr key={evento.id} className="border-t border-slate-800 text-slate-200">
                <td className="py-2 font-mono">{formatarRelogio(evento.minuto, evento.segundo)}</td>
                <td className="py-2">{evento.jogador_nome || "-"}</td>
                <td className="py-2">{evento.tipo_evento}</td>
                <td className="py-2">{evento.equipe_nome || "-"}</td>
                <td className="py-2">
                  {evento.posicao_x !== null && evento.posicao_x !== undefined && evento.posicao_y !== null && evento.posicao_y !== undefined ? (
                    <span className="inline-flex items-center gap-2 text-emerald-300">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      Zoneado
                    </span>
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                </td>
              </tr>
            ))}
            {!eventos.length && (
              <tr>
                <td className="py-3 text-slate-400" colSpan={5}>
                  Nenhum evento marcado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
