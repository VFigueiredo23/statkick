"use client";

import { MouseEvent, ReactNode, useMemo, useState } from "react";

import { Equipe, Evento, Jogador } from "@/lib/api";

type PosicaoCampo = {
  x: number;
  y: number;
};

type PainelAnaliseEspacialProps = {
  equipes: Equipe[];
  jogadores: Jogador[];
  eventos: Evento[];
  equipeAtivaId: number | null;
  jogadorAtivoId: number | null;
  posicaoSelecionada: PosicaoCampo | null;
  aoSelecionarPosicao: (posicao: PosicaoCampo) => void;
  aoLimparPosicao: () => void;
  mostrarZonaAtual?: boolean;
  mostrarMapaCalor?: boolean;
  compacto?: boolean;
};

function CampoFutebol({
  children,
  interativo = false,
  onClick,
}: {
  children?: ReactNode;
  interativo?: boolean;
  onClick?: (evento: MouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className={`relative aspect-[1.55/1] overflow-hidden rounded-[28px] border border-emerald-400/15 bg-[radial-gradient(circle_at_top,#14532d_0%,#14532d_18%,#0f3d24_70%,#092013_100%)] ${
        interativo ? "cursor-crosshair" : ""
      }`}
      onClick={onClick}
    >
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/30" />
      <div className="absolute left-1/2 top-1/2 h-[24%] w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
      <div className="absolute left-[7%] top-1/2 h-[52%] w-[12%] -translate-y-1/2 rounded-r-[20px] border border-l-0 border-white/30" />
      <div className="absolute right-[7%] top-1/2 h-[52%] w-[12%] -translate-y-1/2 rounded-l-[20px] border border-r-0 border-white/30" />
      <div className="absolute left-[7%] top-1/2 h-[22%] w-[4%] -translate-y-1/2 rounded-r-[14px] border border-l-0 border-white/30" />
      <div className="absolute right-[7%] top-1/2 h-[22%] w-[4%] -translate-y-1/2 rounded-l-[14px] border border-r-0 border-white/30" />
      <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
      <div className="absolute inset-x-[3.5%] inset-y-[5%] rounded-[24px] border border-white/30" />
      {children}
    </div>
  );
}

function formatarPosicao(valor: number) {
  return `${Math.round(valor)}%`;
}

function corHeatmap(intensidade: number) {
  if (intensidade >= 0.85) return "rgba(239, 68, 68, 0.72)";
  if (intensidade >= 0.65) return "rgba(249, 115, 22, 0.62)";
  if (intensidade >= 0.45) return "rgba(250, 204, 21, 0.52)";
  if (intensidade >= 0.25) return "rgba(34, 197, 94, 0.42)";
  return "rgba(59, 130, 246, 0.32)";
}

type CardZonaAtualProps = {
  compacto: boolean;
  posicaoSelecionada: PosicaoCampo | null;
  aoSelecionarPosicao: (posicao: PosicaoCampo) => void;
  aoLimparPosicao: () => void;
};

function CardZonaAtual({ compacto, posicaoSelecionada, aoSelecionarPosicao, aoLimparPosicao }: CardZonaAtualProps) {
  const registrarCliqueNoCampo = (evento: MouseEvent<HTMLDivElement>) => {
    const rect = evento.currentTarget.getBoundingClientRect();
    const x = ((evento.clientX - rect.left) / rect.width) * 100;
    const y = ((evento.clientY - rect.top) / rect.height) * 100;

    aoSelecionarPosicao({
      x: Number(Math.max(0, Math.min(100, x)).toFixed(1)),
      y: Number(Math.max(0, Math.min(100, y)).toFixed(1)),
    });
  };

  return (
    <article className="rounded-[24px] border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">{compacto ? "Campo de marcacao" : "Zona da jogada atual"}</p>
          <p className="mt-1 text-sm text-slate-400">
            {compacto ? "Clique aqui e marque a zona sem sair do video." : "Esse ponto sera usado no proximo evento salvo."}
          </p>
        </div>
        <button
          type="button"
          onClick={aoLimparPosicao}
          className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-200"
        >
          Limpar
        </button>
      </div>

      <div className="mt-4">
        <CampoFutebol interativo onClick={registrarCliqueNoCampo}>
          {posicaoSelecionada && (
            <>
              <div
                className="absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300/20 blur-2xl"
                style={{ left: `${posicaoSelecionada.x}%`, top: `${posicaoSelecionada.y}%` }}
              />
              <div
                className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent shadow-[0_0_0_6px_rgba(34,197,94,0.18)]"
                style={{ left: `${posicaoSelecionada.x}%`, top: `${posicaoSelecionada.y}%` }}
              />
            </>
          )}
        </CampoFutebol>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-300">
        {posicaoSelecionada ? (
          <>
            <p className="font-medium text-white">Ponto pronto para marcacao</p>
            <p className="mt-1">
              Largura: {formatarPosicao(posicaoSelecionada.x)} · Profundidade: {formatarPosicao(posicaoSelecionada.y)}
            </p>
          </>
        ) : (
          <>
            <p className="font-medium text-white">Sem zona definida</p>
            <p className="mt-1 text-slate-400">O evento ainda pode ser salvo sem coordenada, mas nao entra no heatmap.</p>
          </>
        )}
      </div>
    </article>
  );
}

type CardMapaCalorProps = {
  equipes: Equipe[];
  jogadores: Jogador[];
  eventos: Evento[];
  equipeAtivaId: number | null;
  jogadorAtivoId: number | null;
};

function CardMapaCalor({ equipes, jogadores, eventos, equipeAtivaId, jogadorAtivoId }: CardMapaCalorProps) {
  const [tipoEventoFiltro, setTipoEventoFiltro] = useState("todos");

  const equipeAtiva = equipes.find((equipe) => equipe.id === equipeAtivaId) ?? null;
  const jogadorAtivo = jogadores.find((jogador) => jogador.id === jogadorAtivoId) ?? null;

  const eventosComPosicao = useMemo(
    () =>
      eventos.filter(
        (evento) =>
          evento.posicao_x !== null &&
          evento.posicao_x !== undefined &&
          evento.posicao_y !== null &&
          evento.posicao_y !== undefined
      ),
    [eventos]
  );

  const eventosFiltrados = useMemo(() => {
    const porFoco = eventosComPosicao.filter((evento) => {
      if (jogadorAtivoId !== null) return evento.jogador === jogadorAtivoId;
      if (equipeAtivaId !== null) return evento.equipe === equipeAtivaId;
      return true;
    });

    if (tipoEventoFiltro === "todos") return porFoco;
    return porFoco.filter((evento) => evento.tipo_evento === tipoEventoFiltro);
  }, [eventosComPosicao, equipeAtivaId, jogadorAtivoId, tipoEventoFiltro]);

  const opcoesTipoEvento = useMemo(() => Array.from(new Set(eventosComPosicao.map((evento) => evento.tipo_evento))).sort(), [eventosComPosicao]);

  const zonasHeatmap = useMemo(() => {
    const colunas = 12;
    const linhas = 8;
    const grade = Array.from({ length: colunas * linhas }, (_, indice) => ({
      indice,
      x: indice % colunas,
      y: Math.floor(indice / colunas),
      contagem: 0,
    }));

    eventosFiltrados.forEach((evento) => {
      const coluna = Math.min(colunas - 1, Math.max(0, Math.floor(((evento.posicao_x ?? 0) / 100) * colunas)));
      const linha = Math.min(linhas - 1, Math.max(0, Math.floor(((evento.posicao_y ?? 0) / 100) * linhas)));
      grade[linha * colunas + coluna].contagem += 1;
    });

    const maiorContagem = Math.max(...grade.map((item) => item.contagem), 0);
    if (!maiorContagem) return [];

    return grade
      .filter((item) => item.contagem > 0)
      .map((item) => ({
        ...item,
        intensidade: item.contagem / maiorContagem,
        left: (item.x / colunas) * 100,
        top: (item.y / linhas) * 100,
        width: 100 / colunas,
        height: 100 / linhas,
      }));
  }, [eventosFiltrados]);

  const resumoFoco = jogadorAtivo
    ? `Heatmap de ${jogadorAtivo.nome}`
    : equipeAtiva
      ? `Heatmap de ${equipeAtiva.nome}`
      : "Heatmap geral da partida";

  return (
    <article className="rounded-[24px] border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Mapa de calor</p>
          <p className="mt-1 text-sm text-slate-400">Filtrado pelo foco atual da analise.</p>
        </div>
        <select
          value={tipoEventoFiltro}
          onChange={(evento) => setTipoEventoFiltro(evento.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <option value="todos">Todos os eventos</option>
          {opcoesTipoEvento.map((tipoEvento) => (
            <option key={tipoEvento} value={tipoEvento}>
              {tipoEvento}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <CampoFutebol>
          {zonasHeatmap.map((zona) => (
            <div key={`zona-${zona.indice}`}>
              <div
                className="absolute blur-xl"
                style={{
                  left: `${zona.left}%`,
                  top: `${zona.top}%`,
                  width: `${zona.width}%`,
                  height: `${zona.height}%`,
                  backgroundColor: corHeatmap(zona.intensidade),
                  opacity: 0.95,
                }}
              />
            </div>
          ))}

          {eventosFiltrados.map((evento) => (
            <div key={evento.id}>
              <div
                className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/35 bg-white/70"
                style={{ left: `${evento.posicao_x}%`, top: `${evento.posicao_y}%` }}
              />
            </div>
          ))}

          {!eventosFiltrados.length && (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-slate-200">
              Nenhum evento com coordenada registrado para esse foco ainda.
            </div>
          )}
        </CampoFutebol>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Foco</p>
          <p className="mt-2 text-sm font-medium text-white">{jogadorAtivo?.nome ?? equipeAtiva?.nome ?? "Partida inteira"}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Filtro</p>
          <p className="mt-2 text-sm font-medium text-white">{tipoEventoFiltro === "todos" ? "Todos os eventos" : tipoEventoFiltro}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Pontos</p>
          <p className="mt-2 text-sm font-medium text-white">{eventosFiltrados.length} zona(s) mapeada(s)</p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
          <span className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Legenda</span>
          {[
            { cor: "rgba(59, 130, 246, 0.7)", rotulo: "Baixa" },
            { cor: "rgba(34, 197, 94, 0.7)", rotulo: "Media" },
            { cor: "rgba(249, 115, 22, 0.7)", rotulo: "Alta" },
            { cor: "rgba(239, 68, 68, 0.75)", rotulo: "Pico" },
          ].map((item) => (
            <span key={item.rotulo} className="inline-flex items-center gap-2">
              <span className="h-3 w-8 rounded-full" style={{ backgroundColor: item.cor }} />
              {item.rotulo}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-3 text-sm text-slate-300">
        <p className="font-medium text-white">{resumoFoco}</p>
        <p className="mt-1 text-slate-400">{eventosFiltrados.length} evento(s) com posicao registrada</p>
      </div>
    </article>
  );
}

export default function PainelAnaliseEspacial({
  equipes,
  jogadores,
  eventos,
  equipeAtivaId,
  jogadorAtivoId,
  posicaoSelecionada,
  aoSelecionarPosicao,
  aoLimparPosicao,
  mostrarZonaAtual = true,
  mostrarMapaCalor = true,
  compacto = false,
}: PainelAnaliseEspacialProps) {
  const classesBase = compacto
    ? "rounded-[28px] border border-slate-700/70 bg-panel p-4"
    : "rounded-[28px] border border-slate-700/70 bg-panel p-5";

  const totalBlocos = Number(mostrarZonaAtual) + Number(mostrarMapaCalor);

  return (
    <section className={classesBase}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Analise espacial</p>
          <h2 className={`mt-2 font-semibold text-white ${compacto ? "text-xl" : "text-2xl"}`}>
            {mostrarZonaAtual && !mostrarMapaCalor ? "Campo de marcacao ao lado do video" : "Campo, zonas e mapa de calor"}
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            {mostrarZonaAtual && !mostrarMapaCalor
              ? "Marque a zona aqui e dispare o evento sem descer a tela."
              : "Clique no campo para definir a zona do lance. Os eventos com coordenada alimentam o mapa de calor automaticamente."}
          </p>
        </div>
      </div>

      <div className={`mt-6 grid gap-5 ${totalBlocos === 2 ? "xl:grid-cols-[0.9fr_1.1fr]" : ""}`}>
        {mostrarZonaAtual && (
          <CardZonaAtual
            compacto={compacto}
            posicaoSelecionada={posicaoSelecionada}
            aoSelecionarPosicao={aoSelecionarPosicao}
            aoLimparPosicao={aoLimparPosicao}
          />
        )}

        {mostrarMapaCalor && (
          <CardMapaCalor
            equipes={equipes}
            jogadores={jogadores}
            eventos={eventos}
            equipeAtivaId={equipeAtivaId}
            jogadorAtivoId={jogadorAtivoId}
          />
        )}
      </div>
    </section>
  );
}
