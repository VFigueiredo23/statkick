"use client";

import Image from "next/image";

import { Jogador } from "@/lib/api";

const CAMPOS_ATRIBUTO = [
  { chave: "tecnica", rotulo: "TEC" },
  { chave: "fisico", rotulo: "FIS" },
  { chave: "velocidade", rotulo: "VEL" },
  { chave: "inteligencia_tatica", rotulo: "TAT" },
  { chave: "competitividade", rotulo: "COM" },
  { chave: "potencial", rotulo: "POT" }
] as const;

type ChaveAtributo = (typeof CAMPOS_ATRIBUTO)[number]["chave"];

function iniciais(nome: string) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
}

export default function CartaoScoutJogador({ jogador }: { jogador: Jogador }) {
  const avaliacao = jogador.ultima_avaliacao;
  const notaGeral = avaliacao?.nota_geral ?? "--";

  return (
    <div className="rounded-[24px] border border-amber-200/15 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.18),_transparent_28%),linear-gradient(155deg,rgba(35,25,7,0.98),rgba(92,57,8,0.88),rgba(17,24,39,0.98))] p-4 shadow-[0_22px_55px_rgba(15,23,42,0.34)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-amber-200/70">Cartao scout</p>
          <p className="mt-2 text-4xl font-semibold leading-none text-white">{notaGeral}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-amber-100/80">{jogador.posicao}</p>
        </div>

        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[20px] border border-white/10 bg-black/30">
          {jogador.foto ? (
            <Image src={jogador.foto} alt={jogador.nome} width={80} height={80} className="h-full w-full object-cover" unoptimized />
          ) : (
            <span className="text-xl font-semibold text-amber-100/90">{iniciais(jogador.nome)}</span>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-lg font-semibold text-white">{jogador.nome}</p>
        <p className="mt-1 text-sm text-amber-50/80">{jogador.independente ? "Independente" : jogador.equipe_nome || "Sem equipe"}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-amber-50/80">
        <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2">
          <p className="uppercase tracking-[0.25em] text-amber-100/55">Idade</p>
          <p className="mt-1 text-sm font-medium text-white">{jogador.idade} anos</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2">
          <p className="uppercase tracking-[0.25em] text-amber-100/55">Categoria</p>
          <p className="mt-1 text-sm font-medium text-white">{jogador.categoria_organizacao || "Livre"}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
        {CAMPOS_ATRIBUTO.map((campo) => (
          <div key={campo.chave} className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="text-xs tracking-[0.28em] text-amber-100/70">{campo.rotulo}</span>
            <span className="text-base font-semibold text-white">
              {avaliacao ? avaliacao[campo.chave as ChaveAtributo] : "--"}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-5 text-amber-50/82">
        {jogador.informacoes_analista?.trim() || "Sem observacoes extras no perfil do atleta."}
      </p>
    </div>
  );
}
