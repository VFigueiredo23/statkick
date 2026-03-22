"use client";

import { PointerEvent, useEffect, useId, useState } from "react";

type FerramentaDesenho = "nenhuma" | "linha" | "seta" | "retangulo" | "destaque";

type Ponto = {
  x: number;
  y: number;
};

type Anotacao = {
  id: number;
  ferramenta: Exclude<FerramentaDesenho, "nenhuma">;
  cor: string;
  inicio: Ponto;
  fim: Ponto;
};

const CORES = ["#22c55e", "#f97316", "#38bdf8", "#facc15", "#f8fafc"];

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

function Retangulo({ inicio, fim, cor }: { inicio: Ponto; fim: Ponto; cor: string }) {
  const x = Math.min(inicio.x, fim.x);
  const y = Math.min(inicio.y, fim.y);
  const width = Math.abs(fim.x - inicio.x);
  const height = Math.abs(fim.y - inicio.y);

  return <rect x={x} y={y} width={width} height={height} fill="transparent" stroke={cor} strokeWidth="0.75" rx="1.5" />;
}

function Destaque({ inicio, fim, cor }: { inicio: Ponto; fim: Ponto; cor: string }) {
  const raio = Math.max(Math.abs(fim.x - inicio.x), Math.abs(fim.y - inicio.y), 4);
  return <circle cx={inicio.x} cy={inicio.y} r={raio} fill="transparent" stroke={cor} strokeWidth="0.85" />;
}

function RenderizarAnotacao({
  anotacao,
  markerId,
}: {
  anotacao: Anotacao;
  markerId: string;
}) {
  if (anotacao.ferramenta === "retangulo") {
    return <Retangulo inicio={anotacao.inicio} fim={anotacao.fim} cor={anotacao.cor} />;
  }

  if (anotacao.ferramenta === "destaque") {
    return <Destaque inicio={anotacao.inicio} fim={anotacao.fim} cor={anotacao.cor} />;
  }

  return (
    <line
      x1={anotacao.inicio.x}
      y1={anotacao.inicio.y}
      x2={anotacao.fim.x}
      y2={anotacao.fim.y}
      stroke={anotacao.cor}
      strokeWidth="0.85"
      strokeLinecap="round"
      markerEnd={anotacao.ferramenta === "seta" ? `url(#${markerId})` : undefined}
    />
  );
}

export default function OverlayTaticoVideo({ resetKey }: { resetKey: string }) {
  const [ferramenta, setFerramenta] = useState<FerramentaDesenho>("nenhuma");
  const [corAtual, setCorAtual] = useState(CORES[0]);
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [rascunho, setRascunho] = useState<Anotacao | null>(null);
  const [contador, setContador] = useState(1);
  const markerId = `arrowhead-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    setAnotacoes([]);
    setRascunho(null);
    setFerramenta("nenhuma");
    setContador(1);
  }, [resetKey]);

  const iniciarDesenho = (evento: PointerEvent<SVGSVGElement>) => {
    if (ferramenta === "nenhuma") return;
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

  const atualizarDesenho = (evento: PointerEvent<SVGSVGElement>) => {
    if (!rascunho) return;
    const ponto = obterPonto(evento);
    setRascunho((atual) => (atual ? { ...atual, fim: ponto } : null));
  };

  const finalizarDesenho = (evento: PointerEvent<SVGSVGElement>) => {
    if (!rascunho) return;
    const ponto = obterPonto(evento);
    const final = { ...rascunho, fim: ponto };
    setAnotacoes((atual) => [...atual, final]);
    setRascunho(null);
    setContador((atual) => atual + 1);
  };

  return (
    <>
      <div className="absolute left-3 right-3 top-3 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800/90 bg-slate-950/80 px-3 py-2 backdrop-blur">
        <span className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Quadro tatico</span>
        {[
          { id: "nenhuma", label: "Cursor" },
          { id: "linha", label: "Linha" },
          { id: "seta", label: "Seta" },
          { id: "retangulo", label: "Box" },
          { id: "destaque", label: "Spot" },
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
            }}
            className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-200"
          >
            Limpar
          </button>
        </div>
      </div>

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={`absolute inset-0 z-10 h-full w-full ${ferramenta === "nenhuma" ? "pointer-events-none" : "pointer-events-auto cursor-crosshair"}`}
        onPointerDown={iniciarDesenho}
        onPointerMove={atualizarDesenho}
        onPointerUp={finalizarDesenho}
        onPointerLeave={() => setRascunho(null)}
      >
        <defs>
          <marker id={markerId} markerWidth="6" markerHeight="6" refX="4.5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="context-stroke" />
          </marker>
        </defs>

        {anotacoes.map((anotacao) => (
          <RenderizarAnotacao key={anotacao.id} anotacao={anotacao} markerId={markerId} />
        ))}
        {rascunho && <RenderizarAnotacao anotacao={rascunho} markerId={markerId} />}
      </svg>

      <div className="absolute bottom-3 left-3 z-20 rounded-full border border-slate-800/90 bg-slate-950/75 px-3 py-1.5 text-xs text-slate-300 backdrop-blur">
        Pause o lance, desenhe e destaque a leitura tática sobre o frame.
      </div>
    </>
  );
}
