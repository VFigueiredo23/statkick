"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Partida, criarPartida, listarPartidas } from "@/lib/api";

function formatarData(valor: string): string {
  return new Date(valor).toLocaleString("pt-BR");
}

export default function PaginaPartidas() {
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [equipeCasa, setEquipeCasa] = useState("");
  const [equipeFora, setEquipeFora] = useState("");
  const [competicao, setCompeticao] = useState("");
  const [tipoVideo, setTipoVideo] = useState<"upload" | "link">("link");
  const [urlVideo, setUrlVideo] = useState("");
  const [arquivoVideo, setArquivoVideo] = useState<File | null>(null);

  const podeEnviar = useMemo(() => {
    if (!equipeCasa.trim() || !equipeFora.trim() || !competicao.trim()) return false;
    if (equipeCasa.trim().toLowerCase() === equipeFora.trim().toLowerCase()) return false;
    if (tipoVideo === "link" && !urlVideo) return false;
    if (tipoVideo === "upload" && !arquivoVideo) return false;
    return true;
  }, [arquivoVideo, competicao, equipeCasa, equipeFora, tipoVideo, urlVideo]);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const dadosPartidas = await listarPartidas();
      setPartidas(dadosPartidas);
    } catch (erroCarga) {
      setErro(erroCarga instanceof Error ? erroCarga.message : "Erro ao carregar partidas");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const submit = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!podeEnviar) return;

    try {
      setSalvando(true);
      setErro(null);
      const criada = await criarPartida({
        equipe_casa_nome_input: equipeCasa.trim(),
        equipe_fora_nome_input: equipeFora.trim(),
        competicao,
        tipo_video: tipoVideo,
        url_video: tipoVideo === "link" ? urlVideo : undefined,
        arquivo_video: tipoVideo === "upload" ? arquivoVideo ?? undefined : undefined
      });

      setPartidas((atual) => [criada, ...atual]);
      setEquipeCasa("");
      setEquipeFora("");
      setCompeticao("");
      setTipoVideo("link");
      setUrlVideo("");
      setArquivoVideo(null);
    } catch (erroSalvar) {
      setErro(erroSalvar instanceof Error ? erroSalvar.message : "Erro ao criar partida");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-white">Partidas</h1>

      <section id="cadastro-partida" className="mb-8 rounded-xl border border-slate-700 bg-panel p-4">
        <h2 className="mb-4 text-lg font-semibold text-white">Cadastrar partida</h2>

        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={submit}>
          <label className="text-sm text-slate-300">
            Equipe da casa
            <input
              className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2"
              value={equipeCasa}
              onChange={(evento) => setEquipeCasa(evento.target.value)}
              placeholder="Ex.: Time observado"
            />
          </label>

          <label className="text-sm text-slate-300">
            Equipe de fora
            <input
              className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2"
              value={equipeFora}
              onChange={(evento) => setEquipeFora(evento.target.value)}
              placeholder="Ex.: Adversario"
            />
          </label>

          <label className="text-sm text-slate-300">
            Competicao
            <input
              className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2"
              value={competicao}
              onChange={(evento) => setCompeticao(evento.target.value)}
              placeholder="Ex.: amistoso, peneira, observacao individual"
            />
          </label>

          <label className="text-sm text-slate-300">
            Origem do video
            <select
              className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2"
              value={tipoVideo}
              onChange={(evento) => setTipoVideo(evento.target.value as "upload" | "link")}
            >
              <option value="link">Link</option>
              <option value="upload">Upload local</option>
            </select>
          </label>

          {tipoVideo === "link" ? (
            <label className="text-sm text-slate-300">
              URL do video
              <input
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2"
                value={urlVideo}
                onChange={(evento) => setUrlVideo(evento.target.value)}
                placeholder="https://... (YouTube ou arquivo direto .mp4/.webm)"
              />
            </label>
          ) : (
            <label className="text-sm text-slate-300">
              Arquivo de video
              <input
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2"
                type="file"
                accept="video/*"
                onChange={(evento) => setArquivoVideo(evento.target.files?.[0] ?? null)}
              />
            </label>
          )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={!podeEnviar || salvando}
              className="rounded bg-accent px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Salvar partida"}
            </button>
          </div>
        </form>
      </section>

      {erro && <p className="mb-4 rounded border border-red-600 bg-red-950/30 p-3 text-red-300">{erro}</p>}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Lista de partidas</h2>
        {carregando && <p className="text-slate-300">Carregando...</p>}

        {!carregando &&
          partidas.map((partida) => (
            <article key={partida.id} className="rounded-xl border border-slate-700 bg-panel p-4">
              <p className="text-lg font-semibold text-white">
                {partida.equipe_casa_nome} x {partida.equipe_fora_nome}
              </p>
              <p className="text-sm text-slate-300">{partida.competicao}</p>
              <p className="text-sm text-slate-400">{formatarData(partida.data)}</p>
              <Link className="mt-3 inline-block rounded bg-accent px-3 py-2 text-sm font-semibold text-black" href={`/analise/${partida.id}`}>
                Analisar
              </Link>
            </article>
          ))}

        {!carregando && !partidas.length && <p className="text-slate-300">Nenhuma partida cadastrada.</p>}
      </section>
    </main>
  );
}
