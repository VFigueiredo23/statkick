"use client";

import { PointerEvent, useCallback, useEffect, useId, useMemo, useState } from "react";

import { FERRAMENTA_ATALHOS } from "@/lib/atalhos-analise";

type FerramentaDesenho = "cursor" | "linha" | "seta" | "rota" | "retangulo" | "holofote" | "anel";

type Ponto = {
  x: number;
  y: number;
};

type Anotacao = {
  id: number;
  ferramenta: Exclude<FerramentaDesenho, "cursor">;
  cor: string;
  inicio: Ponto;
  fim: Ponto;
  keyframes?: Array<{
    tempo: number;
    x: number;
    y: number;
    raio: number;
  }>;
};

type ArrasteAtivo = {
  id: number;
  origem: Ponto;
  inicioOriginal: Ponto;
  fimOriginal: Ponto;
  raioOriginal?: number;
  modo?: "shape" | "holofote";
};

const CORES = ["#22c55e", "#f97316", "#38bdf8", "#facc15", "#f8fafc"];

const ROTULO_FERRAMENTA: Record<Anotacao["ferramenta"], string> = {
  linha: "Linha",
  seta: "Seta",
  rota: "Rota",
  retangulo: "Box",
  holofote: "Holofote",
  anel: "Anel",
};

function limitar(valor: number) {
  return Math.max(0, Math.min(100, Number(valor.toFixed(2))));
}

function alvoEditavel(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName);
}

function obterPonto(evento: PointerEvent<SVGSVGElement>): Ponto {
  const rect = evento.currentTarget.getBoundingClientRect();
  return {
    x: limitar(((evento.clientX - rect.left) / rect.width) * 100),
    y: limitar(((evento.clientY - rect.top) / rect.height) * 100),
  };
}

function calcularRaio(anotacao: Anotacao) {
  return Math.max(Math.abs(anotacao.fim.x - anotacao.inicio.x), Math.abs(anotacao.fim.y - anotacao.inicio.y), 4);
}

function upsertHolofoteKeyframe(anotacao: Anotacao, tempoAtual: number, ponto: Ponto, raio: number) {
  const tempoNormalizado = Number(tempoAtual.toFixed(2));
  const tolerancia = 0.12;

  return [
    ...(anotacao.keyframes ?? []).filter((frame) => Math.abs(frame.tempo - tempoNormalizado) > tolerancia),
    {
      tempo: tempoNormalizado,
      x: limitar(ponto.x),
      y: limitar(ponto.y),
      raio,
    },
  ].sort((a, b) => a.tempo - b.tempo);
}

function obterEstadoHolofote(anotacao: Anotacao, tempoAtual: number) {
  const raioPadrao = calcularRaio(anotacao);
  const frames = [...(anotacao.keyframes ?? [])].sort((a, b) => a.tempo - b.tempo);

  if (!frames.length) {
    return { x: anotacao.inicio.x, y: anotacao.inicio.y, raio: raioPadrao };
  }

  if (frames.length === 1 || tempoAtual <= frames[0].tempo) {
    return { x: frames[0].x, y: frames[0].y, raio: frames[0].raio };
  }

  const ultimo = frames[frames.length - 1];
  if (tempoAtual >= ultimo.tempo) {
    return { x: ultimo.x, y: ultimo.y, raio: ultimo.raio };
  }

  for (let indice = 0; indice < frames.length - 1; indice += 1) {
    const atual = frames[indice];
    const proximo = frames[indice + 1];
    if (tempoAtual >= atual.tempo && tempoAtual <= proximo.tempo) {
      const intervalo = Math.max(proximo.tempo - atual.tempo, 0.001);
      const proporcao = (tempoAtual - atual.tempo) / intervalo;
      return {
        x: atual.x + (proximo.x - atual.x) * proporcao,
        y: atual.y + (proximo.y - atual.y) * proporcao,
        raio: atual.raio + (proximo.raio - atual.raio) * proporcao,
      };
    }
  }

  return { x: ultimo.x, y: ultimo.y, raio: ultimo.raio };
}

function RenderizarAnotacao({
  anotacao,
  markerId,
  selecionada,
  emCursor,
  aoSelecionar,
  tempoAtual,
}: {
  anotacao: Anotacao;
  markerId: string;
  selecionada: boolean;
  emCursor: boolean;
  aoSelecionar: (evento: PointerEvent<SVGGElement>) => void;
  tempoAtual: number;
}) {
  const strokeWidth = selecionada ? 1.15 : 0.85;
  const strokeDasharray = selecionada ? "0" : undefined;

  if (anotacao.ferramenta === "retangulo") {
    const x = Math.min(anotacao.inicio.x, anotacao.fim.x);
    const y = Math.min(anotacao.inicio.y, anotacao.fim.y);
    const width = Math.abs(anotacao.fim.x - anotacao.inicio.x);
    const height = Math.abs(anotacao.fim.y - anotacao.inicio.y);

    return (
      <g onPointerDown={aoSelecionar} className={emCursor ? "cursor-move" : undefined}>
        <rect x={x} y={y} width={width} height={height} fill={`${anotacao.cor}22`} stroke={anotacao.cor} strokeWidth={strokeWidth} rx="1.5" />
        <rect x={x} y={y} width={width} height={height} fill="transparent" stroke="transparent" strokeWidth="2.5" rx="1.5" />
      </g>
    );
  }

  if (anotacao.ferramenta === "holofote") {
    const estado = obterEstadoHolofote(anotacao, tempoAtual);
    const raio = estado.raio;

    return (
      <g onPointerDown={aoSelecionar} className={emCursor ? "cursor-move" : undefined}>
        <circle cx={estado.x} cy={estado.y} r={raio + 1.8} fill={`${anotacao.cor}10`} />
        <circle cx={estado.x} cy={estado.y} r={raio + 4.5} fill={`${anotacao.cor}18`}>
          <animate attributeName="opacity" values="0.18;0.35;0.18" dur="1.4s" repeatCount="indefinite" />
        </circle>
        <circle cx={estado.x} cy={estado.y} r={raio} fill="transparent" stroke={anotacao.cor} strokeWidth={strokeWidth} />
        <circle cx={estado.x} cy={estado.y} r={raio + 3.8} fill="transparent" stroke={`${anotacao.cor}66`} strokeWidth="0.45" />
        <circle cx={estado.x} cy={estado.y} r={raio + 7} fill="transparent" stroke="transparent" strokeWidth="8" />
      </g>
    );
  }

  if (anotacao.ferramenta === "anel") {
    const raio = calcularRaio(anotacao);

    return (
      <g onPointerDown={aoSelecionar} className={emCursor ? "cursor-move" : undefined}>
        <circle cx={anotacao.inicio.x} cy={anotacao.inicio.y} r={raio} fill={`${anotacao.cor}0f`} stroke={anotacao.cor} strokeWidth={strokeWidth} strokeDasharray="3 1.4" />
        <circle cx={anotacao.inicio.x} cy={anotacao.inicio.y} r={raio + 2.2} fill="transparent" stroke={`${anotacao.cor}55`} strokeWidth="0.45" />
        <circle cx={anotacao.inicio.x} cy={anotacao.inicio.y} r={raio + 5.4} fill="transparent" stroke="transparent" strokeWidth="8" />
      </g>
    );
  }

  return (
    <g onPointerDown={aoSelecionar} className={emCursor ? "cursor-move" : undefined}>
      <line
        x1={anotacao.inicio.x}
        y1={anotacao.inicio.y}
        x2={anotacao.fim.x}
        y2={anotacao.fim.y}
        stroke={anotacao.cor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={anotacao.ferramenta === "rota" ? "2.4 1.5" : strokeDasharray}
        markerEnd={anotacao.ferramenta === "seta" || anotacao.ferramenta === "rota" ? `url(#${markerId})` : undefined}
      />
      <line
        x1={anotacao.inicio.x}
        y1={anotacao.inicio.y}
        x2={anotacao.fim.x}
        y2={anotacao.fim.y}
        stroke="transparent"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </g>
  );
}

export default function OverlayTaticoVideo({ resetKey, tempoAtual }: { resetKey: string; tempoAtual: number }) {
  const [ferramenta, setFerramenta] = useState<FerramentaDesenho>("cursor");
  const [corAtual, setCorAtual] = useState(CORES[0]);
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [rascunho, setRascunho] = useState<Anotacao | null>(null);
  const [contador, setContador] = useState(1);
  const [selecionadaId, setSelecionadaId] = useState<number | null>(null);
  const [arrasteAtivo, setArrasteAtivo] = useState<ArrasteAtivo | null>(null);
  const [painelMinimizado, setPainelMinimizado] = useState(false);
  const markerId = `arrowhead-${useId().replace(/:/g, "")}`;
  const anotacaoSelecionada = useMemo(() => anotacoes.find((item) => item.id === selecionadaId) ?? null, [anotacoes, selecionadaId]);
  const holofoteSelecionado = anotacaoSelecionada?.ferramenta === "holofote" ? anotacaoSelecionada : null;
  const totalPontosHolofote = holofoteSelecionado?.keyframes?.length ?? 0;

  useEffect(() => {
    setAnotacoes([]);
    setRascunho(null);
    setFerramenta("cursor");
    setContador(1);
    setSelecionadaId(null);
    setArrasteAtivo(null);
    setPainelMinimizado(false);
  }, [resetKey]);

  const anotacoesOrdenadas = useMemo(() => [...anotacoes].sort((a, b) => b.id - a.id), [anotacoes]);

  const iniciarInteracao = (evento: PointerEvent<SVGSVGElement>) => {
    if (ferramenta === "cursor") {
      setSelecionadaId(null);
      return;
    }

    evento.preventDefault();
    const ponto = obterPonto(evento);
    setRascunho({
      id: contador,
      ferramenta,
      cor: corAtual,
      inicio: ponto,
      fim: ponto,
      keyframes:
        ferramenta === "holofote"
          ? [
              {
                tempo: tempoAtual,
                x: ponto.x,
                y: ponto.y,
                raio: 4,
              },
            ]
          : undefined,
    });
  };

  const atualizarInteracao = (evento: PointerEvent<SVGSVGElement>) => {
    if (arrasteAtivo) {
      const ponto = obterPonto(evento);
      const deltaX = ponto.x - arrasteAtivo.origem.x;
      const deltaY = ponto.y - arrasteAtivo.origem.y;

      setAnotacoes((atual) =>
        atual.map((item) =>
          item.id === arrasteAtivo.id
            ? arrasteAtivo.modo === "holofote"
              ? {
                  ...item,
                  keyframes: upsertHolofoteKeyframe(
                    item,
                    tempoAtual,
                    {
                      x: arrasteAtivo.inicioOriginal.x + deltaX,
                      y: arrasteAtivo.inicioOriginal.y + deltaY,
                    },
                    arrasteAtivo.raioOriginal ?? calcularRaio(item)
                  ),
                }
              : {
                ...item,
                inicio: {
                  x: limitar(arrasteAtivo.inicioOriginal.x + deltaX),
                  y: limitar(arrasteAtivo.inicioOriginal.y + deltaY),
                },
                fim: {
                  x: limitar(arrasteAtivo.fimOriginal.x + deltaX),
                  y: limitar(arrasteAtivo.fimOriginal.y + deltaY),
                },
              }
            : item
        )
      );
      return;
    }

    if (!rascunho) return;
    const ponto = obterPonto(evento);
    setRascunho((atual) => (atual ? { ...atual, fim: ponto } : null));
  };

  const finalizarInteracao = (evento: PointerEvent<SVGSVGElement>) => {
    if (arrasteAtivo) {
      setArrasteAtivo(null);
      return;
    }

    if (!rascunho) return;
    const ponto = obterPonto(evento);
    const final = {
      ...rascunho,
      fim: ponto,
      keyframes:
        rascunho.ferramenta === "holofote"
          ? upsertHolofoteKeyframe(
              rascunho,
              tempoAtual,
              rascunho.inicio,
              Math.max(Math.abs(ponto.x - rascunho.inicio.x), Math.abs(ponto.y - rascunho.inicio.y), 4)
            )
          : rascunho.keyframes,
    };
    setAnotacoes((atual) => [...atual, final]);
    setSelecionadaId(final.id);
    setRascunho(null);
    setContador((atual) => atual + 1);
  };

  const selecionarAnotacao = (anotacao: Anotacao, evento: PointerEvent<SVGGElement>) => {
    evento.stopPropagation();
    setSelecionadaId(anotacao.id);

    if (ferramenta !== "cursor") return;

    const ponto = obterPonto(evento as unknown as PointerEvent<SVGSVGElement>);
    const estadoHolofote = anotacao.ferramenta === "holofote" ? obterEstadoHolofote(anotacao, tempoAtual) : null;
    setArrasteAtivo({
      id: anotacao.id,
      origem: ponto,
      inicioOriginal: estadoHolofote ? { x: estadoHolofote.x, y: estadoHolofote.y } : anotacao.inicio,
      fimOriginal: estadoHolofote ? { x: estadoHolofote.x + estadoHolofote.raio, y: estadoHolofote.y + estadoHolofote.raio } : anotacao.fim,
      raioOriginal: estadoHolofote?.raio,
      modo: anotacao.ferramenta === "holofote" ? "holofote" : "shape",
    });
  };

  const excluirAnotacao = useCallback((id: number) => {
    setAnotacoes((atual) => atual.filter((item) => item.id !== id));
    setSelecionadaId((atual) => (atual === id ? null : atual));
  }, []);

  const fixarPontoHolofoteAtual = useCallback(() => {
    if (!holofoteSelecionado) return;
    const estadoAtual = obterEstadoHolofote(holofoteSelecionado, tempoAtual);
    setAnotacoes((atual) =>
      atual.map((item) =>
        item.id === holofoteSelecionado.id
          ? {
              ...item,
              keyframes: upsertHolofoteKeyframe(item, tempoAtual, { x: estadoAtual.x, y: estadoAtual.y }, estadoAtual.raio),
            }
          : item
      )
    );
  }, [holofoteSelecionado, tempoAtual]);

  useEffect(() => {
    const mapaFerramentas = Object.fromEntries(FERRAMENTA_ATALHOS.map((item) => [item.tecla.toLowerCase(), item.ferramenta])) as Record<string, FerramentaDesenho>;

    const aoPressionarTecla = (evento: KeyboardEvent) => {
      if (alvoEditavel(evento.target) || evento.metaKey || evento.ctrlKey || evento.altKey) {
        return;
      }

      const tecla = evento.key.toLowerCase();

      if (tecla === "escape") {
        setSelecionadaId(null);
        return;
      }

      if ((tecla === "backspace" || tecla === "delete") && selecionadaId !== null) {
        evento.preventDefault();
        excluirAnotacao(selecionadaId);
        return;
      }

      if (tecla === "p" && holofoteSelecionado) {
        evento.preventDefault();
        fixarPontoHolofoteAtual();
        return;
      }

      if (mapaFerramentas[tecla]) {
        setFerramenta(mapaFerramentas[tecla]);
      }
    };

    window.addEventListener("keydown", aoPressionarTecla);
    return () => window.removeEventListener("keydown", aoPressionarTecla);
  }, [excluirAnotacao, fixarPontoHolofoteAtual, holofoteSelecionado, selecionadaId, tempoAtual]);

  return (
    <>
      {painelMinimizado ? (
        <button
          type="button"
          onClick={() => setPainelMinimizado(false)}
          className="absolute left-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-slate-800/90 bg-slate-950/82 text-lg text-slate-100 backdrop-blur"
          aria-label="Expandir quadro tatico"
          title="Expandir quadro tatico"
        >
          ▸
        </button>
      ) : (
        <div className="absolute left-3 right-3 top-3 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800/90 bg-slate-950/80 px-3 py-2 backdrop-blur">
          <button
            type="button"
            onClick={() => {
              setPainelMinimizado(true);
              setFerramenta("cursor");
              setSelecionadaId(null);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 text-sm text-slate-200"
            aria-label="Minimizar quadro tatico"
            title="Minimizar quadro tatico"
          >
            ◂
          </button>
          <span className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Quadro tatico</span>
          {[
            { id: "cursor", label: "Cursor" },
            { id: "anel", label: "Anel" },
            { id: "linha", label: "Linha" },
            { id: "seta", label: "Seta" },
            { id: "rota", label: "Rota" },
            { id: "retangulo", label: "Box" },
            { id: "holofote", label: "Holofote" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFerramenta(item.id as FerramentaDesenho)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                ferramenta === item.id ? "border-accent bg-accent/15 text-white" : "border-slate-700 text-slate-300"
              }`}
            >
              {item.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            {CORES.map((cor) => (
              <button
                key={cor}
                type="button"
                onClick={() => setCorAtual(cor)}
                className={`h-6 w-6 rounded-full border ${corAtual === cor ? "border-white" : "border-slate-700"}`}
                style={{ backgroundColor: cor }}
                aria-label={`Selecionar cor ${cor}`}
              />
            ))}
            <button
              type="button"
              onClick={() => {
                setAnotacoes([]);
                setRascunho(null);
                setSelecionadaId(null);
              }}
              className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-200"
            >
              Limpar tudo
            </button>
          </div>
        </div>
      )}

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={`absolute inset-0 z-10 h-full w-full ${
          ferramenta === "cursor" ? "pointer-events-auto" : "pointer-events-auto cursor-crosshair"
        }`}
        onPointerDown={iniciarInteracao}
        onPointerMove={atualizarInteracao}
        onPointerUp={finalizarInteracao}
        onPointerLeave={() => {
          setRascunho(null);
          setArrasteAtivo(null);
        }}
      >
        <defs>
          <marker id={markerId} markerWidth="6" markerHeight="6" refX="4.5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="context-stroke" />
          </marker>
        </defs>

        {anotacoes.map((anotacao) => (
          <RenderizarAnotacao
            key={anotacao.id}
            anotacao={anotacao}
            markerId={markerId}
            selecionada={selecionadaId === anotacao.id}
            emCursor={ferramenta === "cursor"}
            aoSelecionar={(evento) => selecionarAnotacao(anotacao, evento)}
            tempoAtual={tempoAtual}
          />
        ))}
        {rascunho && (
          <RenderizarAnotacao
            anotacao={rascunho}
            markerId={markerId}
            selecionada={false}
            emCursor={false}
            aoSelecionar={() => undefined}
            tempoAtual={tempoAtual}
          />
        )}
      </svg>

      {!painelMinimizado && (
        <div className="absolute bottom-3 left-3 z-20 max-w-[58%] rounded-2xl border border-slate-800/90 bg-slate-950/75 px-3 py-2 text-xs text-slate-300 backdrop-blur">
          Use `V/H/A/L/S/B/R` para trocar a ferramenta. No holofote, deixe o video rodar e arraste acompanhando o jogador para gravar a trilha; `P` fixa um ponto no tempo atual.
        </div>
      )}

      {!painelMinimizado && holofoteSelecionado && (
        <div className="absolute right-3 top-16 z-20 rounded-2xl border border-slate-800/90 bg-slate-950/82 px-3 py-2 text-xs text-slate-300 backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Tracking assistido</p>
          <p className="mt-1">Holofote #{holofoteSelecionado.id} com {totalPontosHolofote} ponto(s)</p>
          <button
            type="button"
            onClick={fixarPontoHolofoteAtual}
            className="mt-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] font-medium text-accent"
          >
            Fixar ponto (P)
          </button>
        </div>
      )}

      {!painelMinimizado && !!anotacoesOrdenadas.length && (
        <div className="absolute bottom-3 right-3 z-20 max-w-[48%] rounded-2xl border border-slate-800/90 bg-slate-950/82 p-3 backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Marcacoes</p>
          <div className="mt-2 max-h-32 space-y-2 overflow-y-auto pr-1">
            {anotacoesOrdenadas.map((anotacao) => (
              <div
                key={anotacao.id}
                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${
                  selecionadaId === anotacao.id ? "border-accent bg-accent/10 text-white" : "border-slate-800 bg-slate-900/60 text-slate-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelecionadaId(anotacao.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: anotacao.cor }} />
                  <span className="truncate">
                    {ROTULO_FERRAMENTA[anotacao.ferramenta]} #{anotacao.id}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => excluirAnotacao(anotacao.id)}
                  className="rounded-full border border-red-500/30 px-2 py-1 text-[11px] text-red-200"
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
