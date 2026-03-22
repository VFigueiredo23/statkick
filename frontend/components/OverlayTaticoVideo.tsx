"use client";

import { PointerEvent, useEffect, useId, useMemo, useState } from "react";

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
};

type ArrasteAtivo = {
  id: number;
  origem: Ponto;
  inicioOriginal: Ponto;
  fimOriginal: Ponto;
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

function RenderizarAnotacao({
  anotacao,
  markerId,
  selecionada,
  emCursor,
  aoSelecionar,
}: {
  anotacao: Anotacao;
  markerId: string;
  selecionada: boolean;
  emCursor: boolean;
  aoSelecionar: (evento: PointerEvent<SVGGElement>) => void;
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
    const raio = calcularRaio(anotacao);

    return (
      <g onPointerDown={aoSelecionar} className={emCursor ? "cursor-move" : undefined}>
        <circle cx={anotacao.inicio.x} cy={anotacao.inicio.y} r={raio + 1.8} fill={`${anotacao.cor}10`} />
        <circle cx={anotacao.inicio.x} cy={anotacao.inicio.y} r={raio + 4.5} fill={`${anotacao.cor}18`}>
          <animate attributeName="opacity" values="0.18;0.35;0.18" dur="1.4s" repeatCount="indefinite" />
        </circle>
        <circle cx={anotacao.inicio.x} cy={anotacao.inicio.y} r={raio} fill="transparent" stroke={anotacao.cor} strokeWidth={strokeWidth} />
        <circle cx={anotacao.inicio.x} cy={anotacao.inicio.y} r={raio + 3.8} fill="transparent" stroke={`${anotacao.cor}66`} strokeWidth="0.45" />
        <circle cx={anotacao.inicio.x} cy={anotacao.inicio.y} r={raio + 7} fill="transparent" stroke="transparent" strokeWidth="8" />
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

export default function OverlayTaticoVideo({ resetKey }: { resetKey: string }) {
  const [ferramenta, setFerramenta] = useState<FerramentaDesenho>("cursor");
  const [corAtual, setCorAtual] = useState(CORES[0]);
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [rascunho, setRascunho] = useState<Anotacao | null>(null);
  const [contador, setContador] = useState(1);
  const [selecionadaId, setSelecionadaId] = useState<number | null>(null);
  const [arrasteAtivo, setArrasteAtivo] = useState<ArrasteAtivo | null>(null);
  const markerId = `arrowhead-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    setAnotacoes([]);
    setRascunho(null);
    setFerramenta("cursor");
    setContador(1);
    setSelecionadaId(null);
    setArrasteAtivo(null);
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
            ? {
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
    const final = { ...rascunho, fim: ponto };
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
    setArrasteAtivo({
      id: anotacao.id,
      origem: ponto,
      inicioOriginal: anotacao.inicio,
      fimOriginal: anotacao.fim,
    });
  };

  const excluirAnotacao = (id: number) => {
    setAnotacoes((atual) => atual.filter((item) => item.id !== id));
    setSelecionadaId((atual) => (atual === id ? null : atual));
  };

  return (
    <>
      <div className="absolute left-3 right-3 top-3 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800/90 bg-slate-950/80 px-3 py-2 backdrop-blur">
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
          />
        ))}
        {rascunho && (
          <RenderizarAnotacao
            anotacao={rascunho}
            markerId={markerId}
            selecionada={false}
            emCursor={false}
            aoSelecionar={() => undefined}
          />
        )}
      </svg>

      <div className="absolute bottom-3 left-3 z-20 rounded-full border border-slate-800/90 bg-slate-950/75 px-3 py-1.5 text-xs text-slate-300 backdrop-blur">
        Use o cursor para selecionar, arrastar e remover uma marcacao individual.
      </div>

      {!!anotacoesOrdenadas.length && (
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
