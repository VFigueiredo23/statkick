"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const submit = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setSalvando(true);
    setErro(null);

    try {
      await entrar({ email, password });
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao entrar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#020617,#0f172a)] px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] border border-slate-800 bg-slate-950/80 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.55)]">
        <p className="text-[11px] uppercase tracking-[0.4em] text-slate-400">StatKick SaaS</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Entrar</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">Acesse sua organizacao para continuar o trabalho de analise.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm text-slate-200">
            Email
            <input
              type="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
              required
            />
          </label>

          <label className="block text-sm text-slate-200">
            Senha
            <input
              type="password"
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
              required
            />
          </label>

          {erro && <p className="rounded-2xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">{erro}</p>}

          <button
            type="submit"
            disabled={salvando}
            className="w-full rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
          >
            {salvando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Ainda nao tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-accent">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}
