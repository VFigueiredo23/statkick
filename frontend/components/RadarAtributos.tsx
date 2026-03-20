"use client";

import { AvaliacaoJogador } from "@/lib/api";

const ATRIBUTOS = [
  { chave: "tecnica", rotulo: "Tecnica" },
  { chave: "fisico", rotulo: "Fisico" },
  { chave: "velocidade", rotulo: "Velocidade" },
  { chave: "inteligencia_tatica", rotulo: "Tatica" },
  { chave: "competitividade", rotulo: "Compet." },
  { chave: "potencial", rotulo: "Potencial" }
] as const;

type ChaveAtributo = (typeof ATRIBUTOS)[number]["chave"];

function valorDaAvaliacao(avaliacao: AvaliacaoJogador | null | undefined, chave: ChaveAtributo) {
  return avaliacao?.[chave] ?? 0;
}

function ponto(valor: number, indice: number, total: number, raio: number, centro: number) {
  const angulo = -Math.PI / 2 + (Math.PI * 2 * indice) / total;
  const distancia = (valor / 100) * raio;
  return {
    x: centro + Math.cos(angulo) * distancia,
    y: centro + Math.sin(angulo) * distancia
  };
}

function construirPoligono(avaliacao: AvaliacaoJogador | null | undefined, raio: number, centro: number) {
  return ATRIBUTOS.map((atributo, indice) => {
    const item = ponto(valorDaAvaliacao(avaliacao, atributo.chave), indice, ATRIBUTOS.length, raio, centro);
    return `${item.x},${item.y}`;
  }).join(" ");
}

export default function RadarAtributos({
  atual,
  anterior
}: {
  atual: AvaliacaoJogador | null | undefined;
  anterior?: AvaliacaoJogador | null;
}) {
  const centro = 96;
  const raio = 60;
  const aneis = [20, 40, 60, 80, 100];
  const poligonoAtual = construirPoligono(atual, raio, centro);
  const poligonoAnterior = construirPoligono(anterior, raio, centro);

  return (
    <div className="rounded-[24px] border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Evolucao tecnica</p>
          <p className="mt-1 text-sm text-slate-300">Atual x avaliacao anterior</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-2 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            Atual
          </span>
          <span className="flex items-center gap-2 text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
            Anterior
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-col items-center">
        <svg viewBox="0 0 192 192" className="h-[190px] w-full max-w-[260px] overflow-visible">
          {aneis.map((nivel) => {
            const pontos = ATRIBUTOS.map((_, indice) => {
              const item = ponto(nivel, indice, ATRIBUTOS.length, raio, centro);
              return `${item.x},${item.y}`;
            }).join(" ");

            return <polygon key={nivel} points={pontos} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="1" />;
          })}

          {ATRIBUTOS.map((atributo, indice) => {
            const extremidade = ponto(100, indice, ATRIBUTOS.length, raio, centro);
            const rotulo = ponto(118, indice, ATRIBUTOS.length, raio, centro);

            return (
              <g key={atributo.chave}>
                <line x1={centro} y1={centro} x2={extremidade.x} y2={extremidade.y} stroke="rgba(148,163,184,0.14)" strokeWidth="1" />
                <text
                  x={rotulo.x}
                  y={rotulo.y}
                  fill="rgba(226,232,240,0.72)"
                  fontSize="9"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {atributo.rotulo}
                </text>
              </g>
            );
          })}

          {anterior && (
            <polygon
              points={poligonoAnterior}
              fill="rgba(56,189,248,0.16)"
              stroke="rgba(56,189,248,0.9)"
              strokeWidth="2"
            />
          )}

          <polygon points={poligonoAtual} fill="rgba(34,197,94,0.22)" stroke="rgba(34,197,94,0.96)" strokeWidth="2.5" />
        </svg>

        {!anterior && <p className="text-center text-sm text-slate-400">Registre mais uma avaliacao para comparar evolucao.</p>}
      </div>
    </div>
  );
}
