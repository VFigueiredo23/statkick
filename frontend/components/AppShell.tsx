"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/components/AuthProvider";

const ROTAS_PUBLICAS = new Set(["/login", "/cadastro"]);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { autenticado, carregando, organizacaoAtual, organizacoes, selecionarOrganizacao, sair, usuario } = useAuth();

  useEffect(() => {
    if (carregando) return;

    if (!autenticado && !ROTAS_PUBLICAS.has(pathname)) {
      router.replace("/login");
      return;
    }

    if (autenticado && ROTAS_PUBLICAS.has(pathname)) {
      router.replace("/");
    }
  }, [autenticado, carregando, pathname, router]);

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-300">
        Carregando sessao...
      </div>
    );
  }

  if (!autenticado && ROTAS_PUBLICAS.has(pathname)) {
    return <>{children}</>;
  }

  if (autenticado && ROTAS_PUBLICAS.has(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-300">
        Redirecionando...
      </div>
    );
  }

  if (!autenticado) {
    return null;
  }

  return (
    <>
      <div className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-semibold tracking-tight text-white">
              StatKick
            </Link>

            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="rounded-full px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white">
                Inicio
              </Link>
              <Link href="/partidas" className="rounded-full px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white">
                Partidas
              </Link>
              <Link href="/equipes" className="rounded-full px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white">
                Equipes
              </Link>
              <Link href="/jogadores" className="rounded-full px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white">
                Jogadores
              </Link>
            </nav>
          </div>

          <div className="flex flex-col gap-2 text-sm md:flex-row md:items-center">
            <select
              value={organizacaoAtual ? String(organizacaoAtual.id) : ""}
              onChange={(evento) => {
                selecionarOrganizacao(evento.target.value);
                window.location.reload();
              }}
              className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200"
            >
              {organizacoes.map((organizacao) => (
                <option key={organizacao.id} value={organizacao.id}>
                  {organizacao.nome}
                </option>
              ))}
            </select>

            <div className="rounded-full border border-slate-800 bg-slate-900/70 px-3 py-2 text-slate-300">
              {usuario?.nome} · {usuario?.email}
            </div>

            <button
              type="button"
              onClick={() => sair().then(() => router.replace("/login"))}
              className="rounded-full border border-slate-700 px-3 py-2 text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      {children}
    </>
  );
}
