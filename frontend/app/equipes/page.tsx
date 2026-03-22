"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import { Equipe, PayloadEquipe, atualizarEquipe, criarEquipe, listarEquipes, listarJogadores } from "@/lib/api";

const ESTADO_INICIAL_FORMULARIO = {
  nome: "",
  categoria_organizacao: "",
  informacoes_analista: "",
  brasao: null as File | null
};

function montarPayload(formulario: typeof ESTADO_INICIAL_FORMULARIO): PayloadEquipe {
  return {
    nome: formulario.nome.trim(),
    categoria_organizacao: formulario.categoria_organizacao.trim(),
    informacoes_analista: formulario.informacoes_analista.trim(),
    brasao: formulario.brasao
  };
}

export default function PaginaEquipes() {
  const { organizacaoAtual } = useAuth();
  const podeEditarConteudo = ["owner", "admin", "analista"].includes(organizacaoAtual?.papel ?? "");
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [formulario, setFormulario] = useState(ESTADO_INICIAL_FORMULARIO);
  const [equipeEmEdicao, setEquipeEmEdicao] = useState<Equipe | null>(null);
  const [previewBrasao, setPreviewBrasao] = useState<string | null>(null);
  const [mapaJogadoresPorEquipe, setMapaJogadoresPorEquipe] = useState<Record<number, number>>({});

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [dadosEquipes, dadosJogadores] = await Promise.all([listarEquipes(), listarJogadores()]);
      setEquipes(dadosEquipes);
      setMapaJogadoresPorEquipe(
        dadosJogadores.reduce<Record<number, number>>((acc, jogador) => {
          if (!jogador.equipe) return acc;
          acc[jogador.equipe] = (acc[jogador.equipe] ?? 0) + 1;
          return acc;
        }, {})
      );
    } catch (erroCarga) {
      setErro(erroCarga instanceof Error ? erroCarga.message : "Erro ao carregar equipes");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!organizacaoAtual) return;
    carregarDados();
  }, [organizacaoAtual?.id]);

  const equipesFiltradas = useMemo(() => {
    return equipes.filter((equipe) => {
      if (!busca) return true;
      const termo = busca.toLowerCase();
      return (
        equipe.nome.toLowerCase().includes(termo) ||
        equipe.categoria_organizacao?.toLowerCase().includes(termo) ||
        equipe.informacoes_analista?.toLowerCase().includes(termo)
      );
    });
  }, [busca, equipes]);

  const limparFormulario = () => {
    setFormulario(ESTADO_INICIAL_FORMULARIO);
    setEquipeEmEdicao(null);
    setPreviewBrasao(null);
  };

  const iniciarEdicao = (equipe: Equipe) => {
    if (!podeEditarConteudo) return;
    setEquipeEmEdicao(equipe);
    setFormulario({
      nome: equipe.nome,
      categoria_organizacao: equipe.categoria_organizacao ?? "",
      informacoes_analista: equipe.informacoes_analista ?? "",
      brasao: null
    });
    setPreviewBrasao(equipe.brasao ?? null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setErro(null);
    if (!podeEditarConteudo) {
      setErro("Seu papel atual nao permite editar equipes.");
      return;
    }

    if (!formulario.nome.trim()) {
      setErro("Preencha o nome da equipe.");
      return;
    }

    try {
      setSalvando(true);
      const payload = montarPayload(formulario);
      const salva = equipeEmEdicao ? await atualizarEquipe(equipeEmEdicao.id, payload) : await criarEquipe(payload);

      setEquipes((atual) => {
        if (equipeEmEdicao) {
          return atual.map((item) => (item.id === salva.id ? salva : item));
        }
        return [salva, ...atual];
      });

      limparFormulario();
    } catch (erroSalvar) {
      setErro(erroSalvar instanceof Error ? erroSalvar.message : "Erro ao salvar equipe");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-[28px] border border-slate-700 bg-panel p-6">
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Cadastro de clubes</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{equipeEmEdicao ? "Editar equipe" : "Nova equipe"}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Organize sua base de clubes com brasao, categoria interna e informacoes que facilitem o trabalho do analista.
          </p>
          {!podeEditarConteudo && <p className="mt-4 text-sm text-slate-400">Seu papel atual permite apenas visualizacao.</p>}

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <label className="block text-sm text-slate-300">
              Nome da equipe
              <input
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2"
                value={formulario.nome}
                onChange={(evento) => setFormulario((atual) => ({ ...atual, nome: evento.target.value }))}
                placeholder="Ex.: São Gonçalo Sub-20"
              />
            </label>

            <label className="block text-sm text-slate-300">
              Brasao
              <input
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2"
                type="file"
                accept="image/*"
                onChange={(evento) => {
                  const arquivo = evento.target.files?.[0] ?? null;
                  setFormulario((atual) => ({ ...atual, brasao: arquivo }));
                  setPreviewBrasao(arquivo ? URL.createObjectURL(arquivo) : equipeEmEdicao?.brasao ?? null);
                }}
              />
            </label>

            {previewBrasao && (
              <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/50 p-3">
                <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-slate-900">
                  <Image src={previewBrasao} alt="Preview do brasao" fill className="object-cover" unoptimized />
                </div>
              </div>
            )}

            <label className="block text-sm text-slate-300">
              Categoria de organizacao
              <input
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2"
                value={formulario.categoria_organizacao}
                onChange={(evento) => setFormulario((atual) => ({ ...atual, categoria_organizacao: evento.target.value }))}
                placeholder="Ex.: observado, base, prioridade, rival"
              />
            </label>

            <label className="block text-sm text-slate-300">
              Informacoes do analista
              <textarea
                className="mt-1 min-h-32 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2"
                value={formulario.informacoes_analista}
                onChange={(evento) => setFormulario((atual) => ({ ...atual, informacoes_analista: evento.target.value }))}
                placeholder="Contexto do clube, categoria observada, links de referencia, padrao tatico, observacoes internas..."
              />
            </label>

            {erro && <p className="rounded-2xl border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">{erro}</p>}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={salvando || !podeEditarConteudo}
                className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-black disabled:opacity-60"
              >
                {salvando ? "Salvando..." : equipeEmEdicao ? "Salvar alteracoes" : "Cadastrar equipe"}
              </button>

              {equipeEmEdicao && (
                <button
                  type="button"
                  className="rounded-2xl border border-slate-600 px-5 py-3 text-sm font-semibold text-white"
                  onClick={limparFormulario}
                >
                  Cancelar edicao
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-[28px] border border-slate-700 bg-panel p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Base de clubes</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Equipes cadastradas</h2>
              <p className="mt-2 text-sm text-slate-300">Centralize o contexto dos clubes observados sem depender do admin.</p>
            </div>
          </div>

          <div className="mt-6">
            <input
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por nome, categoria ou observacao"
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {carregando && <p className="text-sm text-slate-400">Carregando equipes...</p>}

            {!carregando &&
              equipesFiltradas.map((equipe) => (
                <article key={equipe.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                        {equipe.brasao ? (
                          <Image src={equipe.brasao} alt={equipe.nome} fill className="object-cover" unoptimized />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-slate-500">Sem brasao</div>
                        )}
                      </div>

                      <div>
                        <p className="text-lg font-semibold text-white">{equipe.nome}</p>
                        <p className="mt-1 text-sm text-slate-400">{mapaJogadoresPorEquipe[equipe.id] ?? 0} atletas vinculados</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!podeEditarConteudo}
                      className="rounded-xl border border-slate-600 px-3 py-2 text-xs font-semibold text-white transition hover:border-accent hover:text-accent"
                      onClick={() => iniciarEdicao(equipe)}
                    >
                      Editar
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {equipe.categoria_organizacao ? (
                      <span className="rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-accent">{equipe.categoria_organizacao}</span>
                    ) : (
                      <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-400">Sem categoria</span>
                    )}
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-300">
                    {equipe.informacoes_analista?.trim() || "Sem observacoes registradas para este clube."}
                  </p>
                </article>
              ))}

            {!carregando && !equipesFiltradas.length && (
              <div className="rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400 md:col-span-2">
                Nenhuma equipe encontrada com os filtros atuais.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
