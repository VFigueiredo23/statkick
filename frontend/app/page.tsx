"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import { Equipe, Jogador, Partida, listarEquipes, listarJogadores, listarPartidas } from "@/lib/api";

function formatarData(valor: string): string {
  return new Date(valor).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function StatCard({
  label,
  valor,
  detalhe,
  href
}: {
  label: string;
  valor: string;
  detalhe: string;
  href: string;
}) {
  const conteudo = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">{label}</p>
        <span className="text-xs font-medium text-accent">Abrir</span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-white">{valor}</p>
      <p className="mt-2 text-sm text-slate-400">{detalhe}</p>
    </>
  );

  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-700/80 bg-slate-950/50 p-4 shadow-[0_0_0_1px_rgba(34,197,94,0.06)] transition hover:border-accent/50 hover:bg-slate-950/80 hover:shadow-[0_0_0_1px_rgba(34,197,94,0.18)]"
    >
      {conteudo}
    </Link>
  );
}

function AcaoCard({
  titulo,
  descricao,
  href,
  destaque = false
}: {
  titulo: string;
  descricao: string;
  href: string;
  destaque?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl border p-4 transition ${
        destaque
          ? "border-accent/60 bg-accent/10 hover:bg-accent/15"
          : "border-slate-700 bg-slate-950/40 hover:border-slate-500 hover:bg-slate-950/70"
      }`}
    >
      <p className="text-lg font-semibold text-white">{titulo}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{descricao}</p>
    </Link>
  );
}

export default function HomePage() {
  const { organizacaoAtual } = useAuth();
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!organizacaoAtual) return;
    const carregar = async () => {
      try {
        setCarregando(true);
        setErro(null);
        const [dadosPartidas, dadosEquipes, dadosJogadores] = await Promise.all([
          listarPartidas(),
          listarEquipes(),
          listarJogadores()
        ]);
        setPartidas(dadosPartidas);
        setEquipes(dadosEquipes);
        setJogadores(dadosJogadores);
      } catch (erroCarga) {
        setErro(erroCarga instanceof Error ? erroCarga.message : "Erro ao carregar painel");
      } finally {
        setCarregando(false);
      }
    };

    carregar();
  }, [organizacaoAtual?.id]);

  const resumo = useMemo(() => {
    const independentes = jogadores.filter((jogador) => jogador.independente).length;
    const equipesOrganizadas = equipes.filter(
      (equipe) => Boolean(equipe.categoria_organizacao?.trim()) || Boolean(equipe.informacoes_analista?.trim())
    ).length;
    const jogadoresOrganizados = jogadores.filter(
      (jogador) => Boolean(jogador.categoria_organizacao?.trim()) || Boolean(jogador.informacoes_analista?.trim())
    ).length;

    return {
      independentes,
      equipesOrganizadas,
      jogadoresOrganizados
    };
  }, [equipes, jogadores]);

  const ultimasPartidas = partidas.slice(0, 4);
  const jogadoresRadar = jogadores
    .filter((jogador) => jogador.independente || jogador.categoria_organizacao || jogador.informacoes_analista)
    .slice(0, 5);
  const equipesRadar = equipes.filter((equipe) => equipe.categoria_organizacao || equipe.informacoes_analista).slice(0, 5);
  const jogadoresSemContexto = jogadores
    .filter((jogador) => !jogador.categoria_organizacao?.trim() && !jogador.informacoes_analista?.trim())
    .slice(0, 4);
  const equipesSemContexto = equipes
    .filter((equipe) => !equipe.categoria_organizacao?.trim() && !equipe.informacoes_analista?.trim())
    .slice(0, 4);
  const atletasIndependentes = jogadores.filter((jogador) => jogador.independente).slice(0, 4);
  const hrefAnaliseRapida = ultimasPartidas[0] ? `/analise/${ultimasPartidas[0].id}` : "/partidas";

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8">
      <section className="overflow-hidden rounded-[32px] border border-slate-700/70 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_35%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.92),rgba(2,6,23,0.98))] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.45)] md:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.4em] text-slate-400">Painel do analista</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Sua mesa de trabalho para observar atletas, clubes e partidas sem depender do admin.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Centralize o que voce precisa hoje: criar partidas rapidamente, retomar a ultima analise e acompanhar o que ja foi organizado na sua base.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/partidas#cadastro-partida"
              className="rounded-2xl bg-accent px-5 py-4 text-center text-sm font-semibold text-black shadow-[0_12px_30px_rgba(34,197,94,0.25)] transition hover:translate-y-[-1px]"
            >
              Nova partida
            </Link>
            <Link
              href={hrefAnaliseRapida}
              className="rounded-2xl border border-slate-600 px-5 py-4 text-center text-sm font-semibold text-white transition hover:border-slate-400"
            >
              Retomar analise
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Partidas"
            valor={String(partidas.length)}
            detalhe="Base pronta para video e marcacao de eventos."
            href="/partidas"
          />
          <StatCard
            label="Clubes"
            valor={String(equipes.length)}
            detalhe={`${resumo.equipesOrganizadas} com organizacao ou notas do analista.`}
            href="/equipes"
          />
          <StatCard
            label="Atletas"
            valor={String(jogadores.length)}
            detalhe={`${resumo.independentes} independentes cadastrados.`}
            href="/jogadores"
          />
          <StatCard
            label="Radar"
            valor={String(resumo.jogadoresOrganizados)}
            detalhe="Atletas ja classificados ou anotados na sua base."
            href="#painel-operacional"
          />
        </div>
      </section>

      {erro && <p className="mt-6 rounded-2xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">{erro}</p>}

      <section className="mt-8 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-slate-700/70 bg-slate-950/45 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Acoes rapidas</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Comece pelo que destrava seu fluxo</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <AcaoCard
              titulo="Cadastrar partida"
              descricao="Registrar um novo video com nomes livres de equipe e seguir direto para a analise."
              href="/partidas#cadastro-partida"
              destaque
            />
            <AcaoCard
              titulo="Biblioteca de partidas"
              descricao="Abrir a lista completa, revisar confrontos anteriores e retomar analises em andamento."
              href="/partidas"
            />
            <AcaoCard
              titulo="Gerir equipes"
              descricao="Organizar clubes, subir brasao e registrar contexto do analista fora do admin."
              href="/equipes"
            />
            <AcaoCard
              titulo="Gerir atletas"
              descricao="Cadastrar jogadores independentes, vincular equipes e organizar categorias e notas."
              href="/jogadores"
            />
          </div>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Ultimas partidas</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Retome sem procurar no sistema inteiro</h3>
              </div>
              <Link href="/partidas" className="text-sm text-accent">
                Ver todas
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {carregando && <p className="text-sm text-slate-400">Carregando painel...</p>}

              {!carregando &&
                ultimasPartidas.map((partida) => (
                  <article
                    key={partida.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:flex-row md:items-center"
                  >
                    <div>
                      <p className="text-base font-semibold text-white">
                        {partida.equipe_casa_nome} x {partida.equipe_fora_nome}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">{partida.competicao}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">{formatarData(partida.data)}</p>
                    </div>

                    <Link
                      href={`/analise/${partida.id}`}
                      className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-white transition hover:border-accent hover:text-accent"
                    >
                      Analisar
                    </Link>
                  </article>
                ))}

              {!carregando && !ultimasPartidas.length && (
                <div className="rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">
                  Nenhuma partida cadastrada ainda. Comece criando a primeira diretamente no produto.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <section className="rounded-[28px] border border-slate-700/70 bg-slate-950/45 p-6">
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Radar do analista</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Organizacao da sua base</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              O produto ja consegue separar atletas e clubes com informacoes de apoio para voce consultar sem entrar no admin.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Clubes com contexto</p>
                <div className="mt-3 space-y-3">
                  {equipesRadar.map((equipe) => (
                    <div key={equipe.id} className="rounded-xl border border-slate-800 px-3 py-3">
                      <p className="font-medium text-white">{equipe.nome}</p>
                      <p className="mt-1 text-xs text-slate-400">{equipe.categoria_organizacao || "Sem categoria definida"}</p>
                    </div>
                  ))}
                  {!equipesRadar.length && <p className="text-sm text-slate-400">Nenhum clube com categoria ou nota registrada ainda.</p>}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Atletas em foco</p>
                <div className="mt-3 space-y-3">
                  {jogadoresRadar.map((jogador) => (
                    <div key={jogador.id} className="rounded-xl border border-slate-800 px-3 py-3">
                      <p className="font-medium text-white">{jogador.nome}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {jogador.independente ? "Independente" : jogador.equipe_nome || "Sem equipe"} {jogador.categoria_organizacao ? `• ${jogador.categoria_organizacao}` : ""}
                      </p>
                    </div>
                  ))}
                  {!jogadoresRadar.length && <p className="text-sm text-slate-400">Nenhum atleta classificado ainda.</p>}
                </div>
              </div>
            </div>
          </section>

          <section
            id="painel-operacional"
            className="rounded-[28px] border border-slate-700/70 bg-[linear-gradient(180deg,rgba(34,197,94,0.08),rgba(2,6,23,0.8))] p-6"
          >
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Painel operacional</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">O que pede acao na sua base hoje</h2>

            <div className="mt-5 grid gap-3">
              <article className="rounded-2xl border border-slate-800 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">Atletas para organizar</p>
                    <p className="mt-1 text-sm text-slate-300">
                      {jogadoresSemContexto.length
                        ? `${jogadoresSemContexto.length} sem categoria ou anotacoes entre os primeiros da fila.`
                        : "Sua fila inicial de atletas esta organizada."}
                    </p>
                  </div>
                  <Link href="/jogadores" className="text-sm font-medium text-accent">
                    Abrir atletas
                  </Link>
                </div>
                <div className="mt-3 space-y-2">
                  {jogadoresSemContexto.slice(0, 3).map((jogador) => (
                    <div key={jogador.id} className="rounded-xl border border-slate-800 px-3 py-3">
                      <p className="text-sm font-medium text-white">{jogador.nome}</p>
                      <p className="mt-1 text-xs text-slate-400">{jogador.independente ? "Independente" : jogador.equipe_nome || "Sem equipe vinculada"}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-2xl border border-slate-800 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">Clubes sem contexto registrado</p>
                    <p className="mt-1 text-sm text-slate-300">
                      {equipesSemContexto.length
                        ? `${equipesSemContexto.length} ainda sem categoria interna ou observacao do analista.`
                        : "Seus clubes principais ja tem algum contexto salvo."}
                    </p>
                  </div>
                  <Link href="/equipes" className="text-sm font-medium text-accent">
                    Abrir clubes
                  </Link>
                </div>
                <div className="mt-3 space-y-2">
                  {equipesSemContexto.slice(0, 3).map((equipe) => (
                    <div key={equipe.id} className="rounded-xl border border-slate-800 px-3 py-3">
                      <p className="text-sm font-medium text-white">{equipe.nome}</p>
                      <p className="mt-1 text-xs text-slate-400">Pronto para receber categoria, observacoes ou prioridade.</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-2xl border border-slate-800 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">Consultas rapidas do analista</p>
                    <p className="mt-1 text-sm text-slate-300">
                      Acesso direto ao que normalmente vira consulta do dia: atletas independentes e ultima partida para revisar.
                    </p>
                  </div>
                  <Link href={hrefAnaliseRapida} className="text-sm font-medium text-accent">
                    Abrir ultima analise
                  </Link>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Independentes</p>
                    <div className="mt-3 space-y-2">
                      {atletasIndependentes.map((jogador) => (
                        <div key={jogador.id}>
                          <p className="text-sm font-medium text-white">{jogador.nome}</p>
                          <p className="text-xs text-slate-400">{jogador.posicao || "Posicao nao informada"}</p>
                        </div>
                      ))}
                      {!atletasIndependentes.length && <p className="text-sm text-slate-400">Nenhum atleta independente cadastrado ainda.</p>}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Retomada rapida</p>
                    <div className="mt-3 space-y-2">
                      {ultimasPartidas.slice(0, 2).map((partida) => (
                        <div key={partida.id}>
                          <p className="text-sm font-medium text-white">
                            {partida.equipe_casa_nome} x {partida.equipe_fora_nome}
                          </p>
                          <p className="text-xs text-slate-400">{partida.competicao}</p>
                        </div>
                      ))}
                      {!ultimasPartidas.length && <p className="text-sm text-slate-400">Cadastre uma partida para ter retomada rapida aqui.</p>}
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
