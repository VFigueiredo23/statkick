"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";

function CadastroPageConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const { registrar } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [organizacaoNome, setOrganizacaoNome] = useState("");
  const [password, setPassword] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const submit = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setSalvando(true);
    setErro(null);

    try {
      await registrar({ nome, email, password, organizacao_nome: organizacaoNome });
      router.replace(next || "/");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao criar conta.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#020617,#0f172a)] px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] border border-slate-800 bg-slate-950/80 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.55)]">
        <p className="text-[11px] uppercase tracking-[0.4em] text-slate-400">StatKick SaaS</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Criar conta</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">Abra sua organizacao de teste e comece a estruturar sua operacao.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm text-slate-200">
            Nome
            <input
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
              required
            />
          </label>

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
            Nome da organizacao
            <input
              value={organizacaoNome}
              onChange={(evento) => setOrganizacaoNome(evento.target.value)}
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
              minLength={8}
              required
            />
          </label>

          {erro && <p className="rounded-2xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">{erro}</p>}

          <button
            type="submit"
            disabled={salvando}
            className="w-full rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
          >
            {salvando ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Ja tem conta?{" "}
          <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-medium text-accent">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function CadastroPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#020617,#0f172a)] px-4 py-10">
          <p className="text-sm text-slate-300">Carregando cadastro...</p>
        </main>
      }
    >
      <CadastroPageConteudo />
    </Suspense>
  );
}
