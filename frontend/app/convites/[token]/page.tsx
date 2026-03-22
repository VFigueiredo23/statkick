"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";
import { ConvitePublicoPayload, aceitarConviteOrganizacao, buscarConvitePublico } from "@/lib/api";
import { salvarOrganizacaoId } from "@/lib/auth-storage";

type PaginaConviteProps = {
  params: Promise<{ token: string }>;
};

function formatarData(valor: string) {
  return new Date(valor).toLocaleString("pt-BR");
}

export default function PaginaConvite({ params }: PaginaConviteProps) {
  const { token } = use(params);
  const router = useRouter();
  const { autenticado, atualizarSessao, usuario } = useAuth();
  const [convite, setConvite] = useState<ConvitePublicoPayload | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [aceitando, setAceitando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        setCarregando(true);
        setErro(null);
        const dados = await buscarConvitePublico(token);
        setConvite(dados);
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Falha ao carregar convite.");
      } finally {
        setCarregando(false);
      }
    };

    carregar();
  }, [token]);

  const aceitar = async () => {
    if (!convite) return;

    try {
      setAceitando(true);
      setErro(null);
      await aceitarConviteOrganizacao(token);
      salvarOrganizacaoId(String(convite.organizacao.id));
      await atualizarSessao();
      setMensagem("Convite aceito com sucesso.");
      router.replace("/organizacao");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao aceitar convite.");
    } finally {
      setAceitando(false);
    }
  };

  const next = encodeURIComponent(`/convites/${token}`);

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#020617,#0f172a)] px-4 py-10">
        <p className="text-sm text-slate-300">Carregando convite...</p>
      </main>
    );
  }

  if (!convite) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#020617,#0f172a)] px-4 py-10">
        <p className="rounded-2xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {erro || "Convite nao encontrado."}
        </p>
      </main>
    );
  }

  const emailCompativel = !usuario || usuario.email.toLowerCase() === convite.email.toLowerCase();
  const conviteDisponivel = convite.status === "pendente";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#020617,#0f172a)] px-4 py-10">
      <div className="w-full max-w-2xl rounded-[28px] border border-slate-800 bg-slate-950/80 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.55)]">
        <p className="text-[11px] uppercase tracking-[0.4em] text-slate-400">Convite de organizacao</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{convite.organizacao.nome}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Este convite foi emitido para <strong>{convite.email}</strong> com papel <strong>{convite.papel}</strong>.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Status: {convite.status} · Expira em {formatarData(convite.expira_em)}
        </p>

        {mensagem && <p className="mt-4 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">{mensagem}</p>}
        {erro && <p className="mt-4 rounded-2xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">{erro}</p>}

        {!autenticado ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/login?next=${next}`} className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-black">
              Entrar para aceitar
            </Link>
            <Link href={`/cadastro?next=${next}`} className="rounded-2xl border border-slate-700 px-5 py-3 text-sm font-semibold text-white">
              Criar conta e aceitar
            </Link>
          </div>
        ) : !emailCompativel ? (
          <p className="mt-6 text-sm text-amber-300">
            Voce entrou com {usuario?.email}, mas o convite foi enviado para {convite.email}. Entre com o email correto para aceitar.
          </p>
        ) : conviteDisponivel ? (
          <button
            type="button"
            onClick={aceitar}
            disabled={aceitando}
            className="mt-6 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-black disabled:opacity-60"
          >
            {aceitando ? "Aceitando..." : "Aceitar convite"}
          </button>
        ) : (
          <p className="mt-6 text-sm text-slate-300">Este convite nao esta mais disponivel.</p>
        )}
      </div>
    </main>
  );
}
