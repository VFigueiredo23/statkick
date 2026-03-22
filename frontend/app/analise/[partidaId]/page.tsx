"use client";

import { use, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import BarraEventos from "@/components/BarraEventos";
import CabecalhoAnalise from "@/components/CabecalhoAnalise";
import LinhaTempoEventos from "@/components/LinhaTempoEventos";
import ModalConfiguracaoAnalise, { ConfiguracaoEquipeAnalise } from "@/components/ModalConfiguracaoAnalise";
import PainelAnaliseEspacial from "@/components/PainelAnaliseEspacial";
import PainelContextoAnalise from "@/components/PainelContextoAnalise";
import ReprodutorVideo from "@/components/ReprodutorVideo";
import {
  Equipe,
  Evento,
  Jogador,
  Partida,
  buscarPartida,
  criarJogador,
  criarEvento,
  listarEquipes,
  listarEventosDaPartida,
  listarJogadores
} from "@/lib/api";

type PaginaAnaliseProps = {
  params: Promise<{ partidaId: string }>;
};

function formatarCronometro(segundos: number): string {
  const minutos = Math.floor(segundos / 60)
    .toString()
    .padStart(2, "0");
  const resto = Math.floor(segundos % 60)
    .toString()
    .padStart(2, "0");
  return `${minutos}:${resto}`;
}

export default function PaginaAnalise({ params }: PaginaAnaliseProps) {
  const { partidaId } = use(params);
  const { organizacaoAtual } = useAuth();
  const podeEditarConteudo = ["owner", "admin", "analista"].includes(organizacaoAtual?.papel ?? "");
  const [partida, setPartida] = useState<Partida | null>(null);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [segundosVideo, setSegundosVideo] = useState(0);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [erroOperacao, setErroOperacao] = useState<string | null>(null);
  const [salvandoEvento, setSalvandoEvento] = useState(false);
  const [feedbackEvento, setFeedbackEvento] = useState<string | null>(null);
  const [configuracoesAnalise, setConfiguracoesAnalise] = useState<ConfiguracaoEquipeAnalise[]>([]);
  const [modalConfiguracaoAberto, setModalConfiguracaoAberto] = useState(false);
  const [equipeAtivaId, setEquipeAtivaId] = useState<number | null>(null);
  const [jogadorAtivoId, setJogadorAtivoId] = useState<number | null>(null);
  const [posicaoSelecionada, setPosicaoSelecionada] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!partidaId || !organizacaoAtual) return;
    const carregar = async () => {
      try {
        setErroCarregamento(null);
        const [dadosPartida, dadosEquipes, dadosJogadores, dadosEventos] = await Promise.all([
          buscarPartida(partidaId),
          listarEquipes(),
          listarJogadores(),
          listarEventosDaPartida(partidaId)
        ]);

        setPartida(dadosPartida);
        setEquipes(dadosEquipes);
        setJogadores(dadosJogadores);
        setEventos(dadosEventos);
      } catch (erroCarregamento) {
        setErroCarregamento(erroCarregamento instanceof Error ? erroCarregamento.message : "Erro ao carregar analise");
      }
    };

    carregar();
  }, [organizacaoAtual?.id, partidaId]);

  const jogadoresDaPartida = useMemo(() => {
    if (!partida) return jogadores;
    return jogadores.filter((jogador) => jogador.equipe === partida.equipe_casa || jogador.equipe === partida.equipe_fora);
  }, [jogadores, partida]);

  useEffect(() => {
    if (!partida) return;
    if (configuracoesAnalise.length) return;

    const equipesDaPartida = [partida.equipe_casa, partida.equipe_fora];
    const configuracaoInicial = equipesDaPartida.map((equipeId) => ({
      equipeId,
      modo: "nenhum" as const,
      jogadoresSelecionados: []
    }));

    setConfiguracoesAnalise(configuracaoInicial);
    setEquipeAtivaId(partida.equipe_casa);
    setJogadorAtivoId(null);
    setModalConfiguracaoAberto(true);
  }, [configuracoesAnalise.length, partida]);

  useEffect(() => {
    if (!feedbackEvento) return;
    const timeout = window.setTimeout(() => setFeedbackEvento(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [feedbackEvento]);

  const aplicarConfiguracoesAnalise = (proximasConfiguracoes: ConfiguracaoEquipeAnalise[]) => {
    setConfiguracoesAnalise(proximasConfiguracoes);
    setModalConfiguracaoAberto(false);

    const equipesAnalisadas = proximasConfiguracoes.filter((item) => item.modo !== "nenhum");
    const equipeInicial = equipesAnalisadas[0]?.equipeId ?? null;
    const configuracaoInicial = equipesAnalisadas[0];
    const jogadorInicial =
      configuracaoInicial?.modo === "jogadores" ? configuracaoInicial.jogadoresSelecionados[0] ?? null : null;

    setEquipeAtivaId(equipeInicial);
    setJogadorAtivoId(jogadorInicial);
    setErroOperacao(null);
    setFeedbackEvento(equipesAnalisadas.length ? "Foco de analise atualizado." : "Modo somente visualizacao ativo.");
  };

  const selecionarEquipeAtiva = (proximaEquipeId: number) => {
    setEquipeAtivaId(proximaEquipeId);
    const configuracao = configuracoesAnalise.find((item) => item.equipeId === proximaEquipeId);
    if (!configuracao) {
      setJogadorAtivoId(null);
      return;
    }

    if (configuracao.modo === "nenhum") {
      setJogadorAtivoId(null);
      return;
    }

    if (configuracao.modo === "jogadores") {
      setJogadorAtivoId((atual) => {
        if (atual && configuracao.jogadoresSelecionados.includes(atual)) return atual;
        return configuracao.jogadoresSelecionados[0] ?? null;
      });
      return;
    }

    setJogadorAtivoId(null);
  };

  const marcarEventoRapido = async (tipoEvento: string) => {
    if (!partida) return;
    if (!podeEditarConteudo) {
      setErroOperacao("Seu papel atual permite apenas visualizar a analise.");
      return;
    }
    if (!configuracoesAnalise.some((item) => item.modo !== "nenhum")) {
      setErroOperacao("Defina primeiro o foco da analise para marcar eventos.");
      setModalConfiguracaoAberto(true);
      return;
    }
    if (!equipeAtivaId) {
      setErroOperacao("Selecione a equipe ativa antes de marcar um evento.");
      return;
    }

    const minuto = Math.floor(segundosVideo / 60);
    const segundo = Math.floor(segundosVideo % 60);

    setSalvandoEvento(true);
    setErroOperacao(null);

    try {
      const criado = await criarEvento({
        partida: partida.id,
        equipe: equipeAtivaId,
        jogador: jogadorAtivoId,
        tipo_evento: tipoEvento,
        minuto,
        segundo,
        posicao_x: posicaoSelecionada?.x ?? null,
        posicao_y: posicaoSelecionada?.y ?? null,
        observacoes: ""
      });

      const nomeEquipe = equipes.find((item) => item.id === criado.equipe)?.nome;
      const nomeJogador = jogadoresDaPartida.find((item) => item.id === criado.jogador)?.nome;

      setEventos((atual) => [
        ...atual,
        {
          ...criado,
          equipe_nome: nomeEquipe,
          jogador_nome: nomeJogador
        }
      ]);

      setFeedbackEvento(
        `${tipoEvento} marcado para ${nomeJogador ?? nomeEquipe ?? "equipe"}${posicaoSelecionada ? " com zona de campo." : "."}`
      );
    } catch (erroSalvar) {
      setErroOperacao(erroSalvar instanceof Error ? erroSalvar.message : "Erro ao salvar evento");
    } finally {
      setSalvandoEvento(false);
    }
  };

  const cadastrarJogadorRapido = async ({
    equipeId,
    nome,
    posicao,
    idade
  }: {
    equipeId: number;
    nome: string;
    posicao: string;
    idade: number;
  }) => {
    if (!partida) {
      throw new Error("Partida ainda nao carregada para cadastro rapido.");
    }

    const jogador = await criarJogador({
      nome,
      posicao,
      equipe: equipeId,
      idade,
      independente: false,
      categoria_organizacao: "observacao-partida",
      informacoes_analista: `Cadastro rapido criado dentro da analise da partida ${partida.id}.`
    });

    setJogadores((atual) => {
      const proximo = [jogador, ...atual];
      return proximo;
    });
    setFeedbackEvento(`Atleta ${jogador.nome} cadastrado para a analise.`);
    return jogador.id;
  };

  if (erroCarregamento) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="rounded border border-red-500 bg-red-950/50 p-4 text-red-300">{erroCarregamento}</p>
      </main>
    );
  }

  if (!partida) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-slate-300">Carregando partida...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6">
      <CabecalhoAnalise
        equipeCasa={partida.equipe_casa_nome || "Casa"}
        equipeFora={partida.equipe_fora_nome || "Fora"}
        competicao={partida.competicao}
        tempoJogo={formatarCronometro(segundosVideo)}
      />

      <PainelContextoAnalise
        equipes={equipes.filter((equipe) => equipe.id === partida.equipe_casa || equipe.id === partida.equipe_fora)}
        jogadores={jogadoresDaPartida}
        configuracoes={configuracoesAnalise}
        equipeAtivaId={equipeAtivaId}
        jogadorAtivoId={jogadorAtivoId}
        aoSelecionarEquipe={selecionarEquipeAtiva}
        aoSelecionarJogador={setJogadorAtivoId}
        aoReconfigurar={() => setModalConfiguracaoAberto(true)}
        salvandoEvento={salvandoEvento}
        feedback={feedbackEvento}
      />

      {erroOperacao && <p className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">{erroOperacao}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        <BarraEventos aoSelecionarEvento={marcarEventoRapido} desabilitado={!podeEditarConteudo} />
        <ReprodutorVideo url={partida.url_video} aoAtualizarTempo={setSegundosVideo} />
      </div>

      <PainelAnaliseEspacial
        equipes={equipes.filter((equipe) => equipe.id === partida.equipe_casa || equipe.id === partida.equipe_fora)}
        jogadores={jogadoresDaPartida}
        eventos={eventos}
        equipeAtivaId={equipeAtivaId}
        jogadorAtivoId={jogadorAtivoId}
        posicaoSelecionada={posicaoSelecionada}
        aoSelecionarPosicao={setPosicaoSelecionada}
        aoLimparPosicao={() => setPosicaoSelecionada(null)}
      />

      <LinhaTempoEventos eventos={eventos} />

      <ModalConfiguracaoAnalise
        aberto={modalConfiguracaoAberto}
        equipes={equipes.filter((equipe) => equipe.id === partida.equipe_casa || equipe.id === partida.equipe_fora)}
        jogadores={jogadoresDaPartida}
        configuracoes={configuracoesAnalise}
        podeEditarConteudo={podeEditarConteudo}
        aoCadastrarJogadorRapido={cadastrarJogadorRapido}
        aoCancelar={() => setModalConfiguracaoAberto(false)}
        aoPularAnalise={() => {
          setConfiguracoesAnalise(
            configuracoesAnalise.map((item) => ({
              ...item,
              modo: "nenhum",
              jogadoresSelecionados: []
            }))
          );
          setEquipeAtivaId(null);
          setJogadorAtivoId(null);
          setModalConfiguracaoAberto(false);
          setErroOperacao(null);
          setFeedbackEvento("Modo somente visualizacao ativo.");
        }}
        aoConfirmar={aplicarConfiguracoesAnalise}
      />
    </main>
  );
}
