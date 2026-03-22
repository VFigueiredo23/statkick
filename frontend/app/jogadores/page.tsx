"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import CartaoScoutJogador from "@/components/CartaoScoutJogador";
import RadarAtributos from "@/components/RadarAtributos";
import {
  AvaliacaoJogador,
  Equipe,
  Jogador,
  PayloadAvaliacaoJogador,
  PayloadJogador,
  atualizarJogador,
  criarAvaliacaoJogador,
  criarJogador,
  listarEquipes,
  listarJogadores
} from "@/lib/api";

const ESTADO_INICIAL_FORMULARIO = {
  nome: "",
  posicao: "",
  equipe: "",
  idade: "",
  independente: false,
  categoria_organizacao: "",
  informacoes_analista: "",
  foto: null as File | null
};

const ESTADO_INICIAL_AVALIACAO = {
  tecnica: "65",
  fisico: "65",
  velocidade: "65",
  inteligencia_tatica: "65",
  competitividade: "65",
  potencial: "65",
  observacoes: ""
};

function limitarAtributo(valor: string) {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return 0;
  return Math.max(0, Math.min(99, numero));
}

function montarPayload(formulario: typeof ESTADO_INICIAL_FORMULARIO): PayloadJogador {
  return {
    nome: formulario.nome.trim(),
    posicao: formulario.posicao.trim(),
    equipe: formulario.independente || !formulario.equipe ? null : Number(formulario.equipe),
    idade: Number(formulario.idade),
    independente: formulario.independente,
    categoria_organizacao: formulario.categoria_organizacao.trim(),
    informacoes_analista: formulario.informacoes_analista.trim(),
    foto: formulario.foto
  };
}

function montarPayloadAvaliacao(
  formulario: typeof ESTADO_INICIAL_AVALIACAO,
  jogadorId: number
): PayloadAvaliacaoJogador {
  return {
    jogador: jogadorId,
    tecnica: limitarAtributo(formulario.tecnica),
    fisico: limitarAtributo(formulario.fisico),
    velocidade: limitarAtributo(formulario.velocidade),
    inteligencia_tatica: limitarAtributo(formulario.inteligencia_tatica),
    competitividade: limitarAtributo(formulario.competitividade),
    potencial: limitarAtributo(formulario.potencial),
    observacoes: formulario.observacoes.trim()
  };
}

function textoEscopo(jogador: Jogador) {
  if (jogador.independente) return "Independente";
  return jogador.equipe_nome || "Sem equipe";
}

function formatarData(valor?: string | null) {
  if (!valor) return "Sem historico";
  return new Date(valor).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function preencherAvaliacao(avaliacao?: AvaliacaoJogador | null) {
  if (!avaliacao) return ESTADO_INICIAL_AVALIACAO;
  return {
    tecnica: String(avaliacao.tecnica),
    fisico: String(avaliacao.fisico),
    velocidade: String(avaliacao.velocidade),
    inteligencia_tatica: String(avaliacao.inteligencia_tatica),
    competitividade: String(avaliacao.competitividade),
    potencial: String(avaliacao.potencial),
    observacoes: ""
  };
}

function adicionarAvaliacaoNoJogador(jogador: Jogador, avaliacao: AvaliacaoJogador): Jogador {
  const historico = [avaliacao, ...(jogador.avaliacoes ?? []).filter((item) => item.id !== avaliacao.id)].sort((a, b) => {
    const dataA = new Date(a.data_avaliacao).getTime();
    const dataB = new Date(b.data_avaliacao).getTime();
    if (dataA === dataB) return b.id - a.id;
    return dataB - dataA;
  });

  return {
    ...jogador,
    avaliacoes: historico,
    ultima_avaliacao: historico[0] ?? null,
    avaliacao_anterior: historico[1] ?? null
  };
}

function VariacaoNota({ jogador }: { jogador: Jogador }) {
  const atual = jogador.ultima_avaliacao?.nota_geral;
  const anterior = jogador.avaliacao_anterior?.nota_geral;

  if (typeof atual !== "number") {
    return <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">Sem avaliacao</span>;
  }

  if (typeof anterior !== "number") {
    return <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs text-accent">Primeira analise</span>;
  }

  const delta = atual - anterior;
  const texto = delta === 0 ? "Estavel" : delta > 0 ? `+${delta} em relacao a ultima` : `${delta} em relacao a ultima`;
  const classe =
    delta === 0
      ? "border-slate-700 text-slate-300"
      : delta > 0
        ? "border-accent/40 bg-accent/10 text-accent"
        : "border-amber-400/40 bg-amber-400/10 text-amber-300";

  return <span className={`rounded-full border px-3 py-1 text-xs ${classe}`}>{texto}</span>;
}

function CampoAtributo({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-2xl border border-slate-700 bg-slate-950/50 p-3 text-sm text-slate-200">
      <div className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
          {limitarAtributo(value)}
        </span>
      </div>
      <input
        className="mt-3 w-full accent-green-400"
        type="range"
        min={0}
        max={99}
        value={limitarAtributo(value)}
        onChange={(evento) => onChange(evento.target.value)}
      />
    </label>
  );
}

export default function PaginaJogadores() {
  const { organizacaoAtual } = useAuth();
  const podeEditarConteudo = ["owner", "admin", "analista"].includes(organizacaoAtual?.papel ?? "");
  const carrosselRef = useRef<HTMLDivElement | null>(null);
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvandoAvaliacao, setSalvandoAvaliacao] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroEquipe, setFiltroEquipe] = useState("");
  const [filtroEscopo, setFiltroEscopo] = useState<"todos" | "independentes" | "vinculados">("todos");
  const [formulario, setFormulario] = useState(ESTADO_INICIAL_FORMULARIO);
  const [formularioAvaliacao, setFormularioAvaliacao] = useState(ESTADO_INICIAL_AVALIACAO);
  const [jogadorEmEdicao, setJogadorEmEdicao] = useState<Jogador | null>(null);
  const [jogadorEmAvaliacaoId, setJogadorEmAvaliacaoId] = useState<number | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [dadosJogadores, dadosEquipes] = await Promise.all([listarJogadores(), listarEquipes()]);
      setJogadores(dadosJogadores);
      setEquipes(dadosEquipes);
      setJogadorEmAvaliacaoId((atual) => atual ?? dadosJogadores[0]?.id ?? null);
    } catch (erroCarga) {
      setErro(erroCarga instanceof Error ? erroCarga.message : "Erro ao carregar jogadores");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!organizacaoAtual) return;
    carregarDados();
  }, [organizacaoAtual?.id]);

  const jogadorEmAvaliacao = useMemo(
    () => jogadores.find((jogador) => jogador.id === jogadorEmAvaliacaoId) ?? null,
    [jogadorEmAvaliacaoId, jogadores]
  );

  const jogadoresFiltrados = useMemo(() => {
    return jogadores.filter((jogador) => {
      const bateBusca =
        !busca ||
        jogador.nome.toLowerCase().includes(busca.toLowerCase()) ||
        jogador.equipe_nome?.toLowerCase().includes(busca.toLowerCase()) ||
        jogador.categoria_organizacao?.toLowerCase().includes(busca.toLowerCase());

      const bateEquipe = !filtroEquipe || String(jogador.equipe ?? "") === filtroEquipe;
      const bateEscopo =
        filtroEscopo === "todos" ||
        (filtroEscopo === "independentes" && jogador.independente) ||
        (filtroEscopo === "vinculados" && !jogador.independente);

      return bateBusca && bateEquipe && bateEscopo;
    });
  }, [busca, filtroEquipe, filtroEscopo, jogadores]);

  const limparFormulario = () => {
    setFormulario(ESTADO_INICIAL_FORMULARIO);
    setJogadorEmEdicao(null);
    setPreviewFoto(null);
  };

  const limparFormularioAvaliacao = () => {
    setFormularioAvaliacao(preencherAvaliacao(jogadorEmAvaliacao?.ultima_avaliacao));
  };

  const moverCarrossel = (direcao: "anterior" | "proximo") => {
    const elemento = carrosselRef.current;
    if (!elemento) return;

    const deslocamento = elemento.clientWidth * 0.92 * (direcao === "proximo" ? 1 : -1);
    elemento.scrollBy({ left: deslocamento, behavior: "smooth" });
  };

  const iniciarEdicao = (jogador: Jogador) => {
    if (!podeEditarConteudo) return;
    setJogadorEmEdicao(jogador);
    setFormulario({
      nome: jogador.nome,
      posicao: jogador.posicao,
      equipe: jogador.equipe ? String(jogador.equipe) : "",
      idade: String(jogador.idade),
      independente: jogador.independente,
      categoria_organizacao: jogador.categoria_organizacao ?? "",
      informacoes_analista: jogador.informacoes_analista ?? "",
      foto: null
    });
    setPreviewFoto(jogador.foto ?? null);
    setJogadorEmAvaliacaoId(jogador.id);
    setFormularioAvaliacao(preencherAvaliacao(jogador.ultima_avaliacao));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const iniciarAvaliacao = (jogador: Jogador) => {
    if (!podeEditarConteudo) return;
    setJogadorEmAvaliacaoId(jogador.id);
    setFormularioAvaliacao(preencherAvaliacao(jogador.ultima_avaliacao));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setErro(null);
    if (!podeEditarConteudo) {
      setErro("Seu papel atual nao permite editar jogadores.");
      return;
    }

    if (!formulario.nome.trim() || !formulario.posicao.trim() || !formulario.idade) {
      setErro("Preencha nome, posicao e idade do atleta.");
      return;
    }

    if (!formulario.independente && !formulario.equipe) {
      setErro("Selecione a equipe ou marque o atleta como independente.");
      return;
    }

    try {
      setSalvando(true);
      const payload = montarPayload(formulario);
      const salvo = jogadorEmEdicao ? await atualizarJogador(jogadorEmEdicao.id, payload) : await criarJogador(payload);

      setJogadores((atual) => {
        if (jogadorEmEdicao) {
          return atual.map((item) => (item.id === salvo.id ? { ...item, ...salvo } : item));
        }
        return [salvo, ...atual];
      });

      setJogadorEmAvaliacaoId(salvo.id);
      setFormularioAvaliacao(preencherAvaliacao(salvo.ultima_avaliacao));
      limparFormulario();
    } catch (erroSalvar) {
      setErro(erroSalvar instanceof Error ? erroSalvar.message : "Erro ao salvar jogador");
    } finally {
      setSalvando(false);
    }
  };

  const submitAvaliacao = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setErro(null);
    if (!podeEditarConteudo) {
      setErro("Seu papel atual nao permite registrar avaliacoes.");
      return;
    }

    if (!jogadorEmAvaliacao) {
      setErro("Selecione um atleta para registrar a avaliacao.");
      return;
    }

    try {
      setSalvandoAvaliacao(true);
      const avaliacaoCriada = await criarAvaliacaoJogador(montarPayloadAvaliacao(formularioAvaliacao, jogadorEmAvaliacao.id));

      setJogadores((atual) =>
        atual.map((item) => (item.id === jogadorEmAvaliacao.id ? adicionarAvaliacaoNoJogador(item, avaliacaoCriada) : item))
      );
      setFormularioAvaliacao(preencherAvaliacao(avaliacaoCriada));
    } catch (erroSalvar) {
      setErro(erroSalvar instanceof Error ? erroSalvar.message : "Erro ao salvar avaliacao");
    } finally {
      setSalvandoAvaliacao(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8">
      <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
        <div className="grid gap-6">
          <section className="rounded-[28px] border border-slate-700 bg-panel p-6">
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Perfil do atleta</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{jogadorEmEdicao ? "Editar jogador" : "Novo jogador"}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Cadastre o perfil base do atleta, suba a foto e deixe o restante da leitura tecnica para as avaliacoes.
            </p>
            {!podeEditarConteudo && <p className="mt-4 text-sm text-slate-400">Seu papel atual permite apenas visualizacao.</p>}

            <form className="mt-6 space-y-4" onSubmit={submit}>
              <label className="block text-sm text-slate-300">
                Nome do atleta
                <input
                  className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2"
                  value={formulario.nome}
                  onChange={(evento) => setFormulario((atual) => ({ ...atual, nome: evento.target.value }))}
                  placeholder="Ex.: João Pedro"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-slate-300">
                  Posicao
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2"
                    value={formulario.posicao}
                    onChange={(evento) => setFormulario((atual) => ({ ...atual, posicao: evento.target.value }))}
                    placeholder="Ex.: ponta, zagueiro, volante"
                  />
                </label>

                <label className="block text-sm text-slate-300">
                  Idade
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2"
                    type="number"
                    min={0}
                    value={formulario.idade}
                    onChange={(evento) => setFormulario((atual) => ({ ...atual, idade: evento.target.value }))}
                    placeholder="18"
                  />
                </label>
              </div>

              <label className="block text-sm text-slate-300">
                Foto do atleta
                <input
                  className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2"
                  type="file"
                  accept="image/*"
                  onChange={(evento) => {
                    const arquivo = evento.target.files?.[0] ?? null;
                    setFormulario((atual) => ({ ...atual, foto: arquivo }));
                    setPreviewFoto(arquivo ? URL.createObjectURL(arquivo) : jogadorEmEdicao?.foto ?? null);
                  }}
                />
              </label>

              {previewFoto && (
                <div className="rounded-2xl border border-slate-700 bg-slate-950/55 p-3">
                  <img src={previewFoto} alt="Preview do atleta" className="h-40 w-full rounded-2xl object-cover" />
                </div>
              )}

              <label className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={formulario.independente}
                  onChange={(evento) =>
                    setFormulario((atual) => ({
                      ...atual,
                      independente: evento.target.checked,
                      equipe: evento.target.checked ? "" : atual.equipe
                    }))
                  }
                />
                Jogador independente
              </label>

              <label className="block text-sm text-slate-300">
                Equipe vinculada
                <select
                  className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 disabled:opacity-50"
                  value={formulario.equipe}
                  disabled={formulario.independente}
                  onChange={(evento) => setFormulario((atual) => ({ ...atual, equipe: evento.target.value }))}
                >
                  <option value="">Selecione uma equipe</option>
                  {equipes.map((equipe) => (
                    <option key={equipe.id} value={equipe.id}>
                      {equipe.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-slate-300">
                Categoria de organizacao
                <input
                  className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2"
                  value={formulario.categoria_organizacao}
                  onChange={(evento) => setFormulario((atual) => ({ ...atual, categoria_organizacao: evento.target.value }))}
                  placeholder="Ex.: radar, observacao, prioridade, sub-20"
                />
              </label>

              <label className="block text-sm text-slate-300">
                Informacoes do analista
                <textarea
                  className="mt-1 min-h-28 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2"
                  value={formulario.informacoes_analista}
                  onChange={(evento) => setFormulario((atual) => ({ ...atual, informacoes_analista: evento.target.value }))}
                  placeholder="Contexto do atleta, referencia de observacao, plano de acompanhamento..."
                />
              </label>

              {erro && <p className="rounded-2xl border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">{erro}</p>}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={salvando || !podeEditarConteudo}
                  className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-black disabled:opacity-60"
                >
                  {salvando ? "Salvando..." : jogadorEmEdicao ? "Salvar alteracoes" : "Cadastrar jogador"}
                </button>

                {jogadorEmEdicao && (
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
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Avaliacao tecnica</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Registrar nova leitura</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Os numeros da cartinha saem sempre da ultima avaliacao. O radar compara essa leitura com a anterior.
            </p>

            <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
              {jogadorEmAvaliacao ? (
                <>
                  <p className="text-sm text-slate-400">Atleta em foco</p>
                  <p className="mt-1 text-lg font-semibold text-white">{jogadorEmAvaliacao.nome}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {textoEscopo(jogadorEmAvaliacao)} • ultima leitura em {formatarData(jogadorEmAvaliacao.ultima_avaliacao?.data_avaliacao)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-400">Selecione um atleta da base para registrar a primeira avaliacao.</p>
              )}
            </div>

            <form className="mt-5 space-y-4" onSubmit={submitAvaliacao}>
              <div className="grid gap-3 md:grid-cols-2">
                <CampoAtributo
                  label="Tecnica"
                  value={formularioAvaliacao.tecnica}
                  onChange={(value) => setFormularioAvaliacao((atual) => ({ ...atual, tecnica: value }))}
                />
                <CampoAtributo
                  label="Fisico"
                  value={formularioAvaliacao.fisico}
                  onChange={(value) => setFormularioAvaliacao((atual) => ({ ...atual, fisico: value }))}
                />
                <CampoAtributo
                  label="Velocidade"
                  value={formularioAvaliacao.velocidade}
                  onChange={(value) => setFormularioAvaliacao((atual) => ({ ...atual, velocidade: value }))}
                />
                <CampoAtributo
                  label="Inteligencia tatica"
                  value={formularioAvaliacao.inteligencia_tatica}
                  onChange={(value) => setFormularioAvaliacao((atual) => ({ ...atual, inteligencia_tatica: value }))}
                />
                <CampoAtributo
                  label="Competitividade"
                  value={formularioAvaliacao.competitividade}
                  onChange={(value) => setFormularioAvaliacao((atual) => ({ ...atual, competitividade: value }))}
                />
                <CampoAtributo
                  label="Potencial"
                  value={formularioAvaliacao.potencial}
                  onChange={(value) => setFormularioAvaliacao((atual) => ({ ...atual, potencial: value }))}
                />
              </div>

              <label className="block text-sm text-slate-300">
                Observacoes da analise
                <textarea
                  className="mt-1 min-h-28 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2"
                  value={formularioAvaliacao.observacoes}
                  onChange={(evento) => setFormularioAvaliacao((atual) => ({ ...atual, observacoes: evento.target.value }))}
                  placeholder="Explique o motivo da leitura, contexto do jogo, evolucao percebida e proximos pontos de atencao."
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={salvandoAvaliacao || !jogadorEmAvaliacao || !podeEditarConteudo}
                  className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-black disabled:opacity-60"
                >
                  {salvandoAvaliacao ? "Salvando leitura..." : "Salvar avaliacao"}
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-slate-600 px-5 py-3 text-sm font-semibold text-white"
                  onClick={limparFormularioAvaliacao}
                >
                  Restaurar numeros
                </button>
              </div>
            </form>
          </section>
        </div>

        <section className="rounded-[28px] border border-slate-700 bg-panel p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Base de atletas</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Perfis em formato scout</h2>
              <p className="mt-2 text-sm text-slate-300">
                Visualize cada atleta como uma cartinha com nota geral, atributos e comparacao visual entre a analise atual e a anterior.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-[1.2fr_0.9fr_0.9fr]">
            <input
              className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por nome, equipe ou categoria"
            />

            <select
              className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
              value={filtroEquipe}
              onChange={(evento) => setFiltroEquipe(evento.target.value)}
            >
              <option value="">Todas as equipes</option>
              {equipes.map((equipe) => (
                <option key={equipe.id} value={equipe.id}>
                  {equipe.nome}
                </option>
              ))}
            </select>

            <select
              className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
              value={filtroEscopo}
              onChange={(evento) => setFiltroEscopo(evento.target.value as typeof filtroEscopo)}
            >
              <option value="todos">Todos</option>
              <option value="independentes">So independentes</option>
              <option value="vinculados">So vinculados</option>
            </select>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-400">
              {jogadoresFiltrados.length} atleta{jogadoresFiltrados.length === 1 ? "" : "s"} no carrossel
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-xl border border-slate-600 px-3 py-2 text-xs font-semibold text-white transition hover:border-slate-400"
                onClick={() => moverCarrossel("anterior")}
              >
                Anterior
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-600 px-3 py-2 text-xs font-semibold text-white transition hover:border-slate-400"
                onClick={() => moverCarrossel("proximo")}
              >
                Proximo
              </button>
            </div>
          </div>

          <div ref={carrosselRef} className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            {carregando && <p className="text-sm text-slate-400">Carregando jogadores...</p>}

            {!carregando &&
              jogadoresFiltrados.map((jogador) => (
                <article key={jogador.id} className="min-w-full snap-start rounded-[28px] border border-slate-800 bg-slate-950/60 p-4 md:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xl font-semibold text-white">{jogador.nome}</p>
                        <VariacaoNota jogador={jogador} />
                      </div>
                      <p className="mt-2 text-sm text-slate-400">
                        {textoEscopo(jogador)} • ultima avaliacao em {formatarData(jogador.ultima_avaliacao?.data_avaliacao)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="rounded-xl border border-slate-600 px-3 py-2 text-xs font-semibold text-white transition hover:border-accent hover:text-accent"
                        onClick={() => iniciarEdicao(jogador)}
                      >
                        Editar perfil
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-accent/50 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition hover:bg-accent/15"
                        onClick={() => iniciarAvaliacao(jogador)}
                      >
                        Nova avaliacao
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-4 md:flex-row md:flex-wrap">
                    <div className="w-full md:max-w-[320px]">
                      <CartaoScoutJogador jogador={jogador} />
                    </div>

                    <div className="w-full md:max-w-[320px] rounded-[24px] border border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.92))] p-4">
                      {jogador.ultima_avaliacao ? (
                        <>
                          <RadarAtributos atual={jogador.ultima_avaliacao} anterior={jogador.avaliacao_anterior} />
                          <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Leitura mais recente</p>
                            <p className="mt-2 line-clamp-4 text-sm leading-5 text-slate-300">
                              {jogador.ultima_avaliacao.observacoes?.trim() || "Sem observacoes registradas na ultima analise."}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-700 bg-slate-950/40 p-6 text-center">
                          <p className="text-lg font-semibold text-white">Sem avaliacao ainda</p>
                          <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">
                            Registre a primeira leitura para gerar a nota da cartinha e ativar o grafico de evolucao.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}

            {!carregando && !jogadoresFiltrados.length && (
              <div className="min-w-full rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">
                Nenhum jogador encontrado com os filtros atuais.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
