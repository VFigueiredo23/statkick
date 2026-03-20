"use client";

import { FormEvent, useMemo, useState } from "react";

import { Equipe, Jogador } from "@/lib/api";

type ModalEventoProps = {
  aberto: boolean;
  tipoEvento: string;
  jogadores: Jogador[];
  equipes: Equipe[];
  aoCancelar: () => void;
  aoConfirmar: (payload: { equipe: number | null; jogador: number | null; observacoes: string }) => Promise<void>;
};

export default function ModalEvento({ aberto, tipoEvento, jogadores, equipes, aoCancelar, aoConfirmar }: ModalEventoProps) {
  const [equipe, setEquipe] = useState<string>("");
  const [jogador, setJogador] = useState<string>("");
  const [observacoes, setObservacoes] = useState("");
  const [carregando, setCarregando] = useState(false);

  const jogadoresFiltrados = useMemo(() => {
    if (!equipe) return jogadores;
    return jogadores.filter((j) => j.equipe === Number(equipe));
  }, [jogadores, equipe]);

  if (!aberto) return null;

  const submit = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setCarregando(true);
    try {
      await aoConfirmar({
        equipe: equipe ? Number(equipe) : null,
        jogador: jogador ? Number(jogador) : null,
        observacoes
      });
      setEquipe("");
      setJogador("");
      setObservacoes("");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
      <form className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-4" onSubmit={submit}>
        <h3 className="text-lg font-semibold text-white">Salvar evento: {tipoEvento}</h3>

        <label className="mt-4 block text-sm text-slate-300">
          Equipe
          <select
            className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2"
            value={equipe}
            onChange={(evento) => {
              setEquipe(evento.target.value);
              setJogador("");
            }}
          >
            <option value="">Selecione</option>
            {equipes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-3 block text-sm text-slate-300">
          Jogador
          <select
            className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2"
            value={jogador}
            onChange={(evento) => setJogador(evento.target.value)}
          >
            <option value="">Selecione</option>
            {jogadoresFiltrados.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-3 block text-sm text-slate-300">
          Observacoes
          <textarea
            className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2"
            rows={3}
            value={observacoes}
            onChange={(evento) => setObservacoes(evento.target.value)}
            placeholder="Contexto da jogada"
          />
        </label>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded border border-slate-500 px-3 py-2 text-sm" onClick={aoCancelar}>
            Cancelar
          </button>
          <button type="submit" disabled={carregando} className="rounded bg-accent px-3 py-2 text-sm font-semibold text-black">
            {carregando ? "Salvando..." : "Confirmar"}
          </button>
        </div>
      </form>
    </div>
  );
}
