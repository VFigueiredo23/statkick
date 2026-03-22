"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import OverlayTaticoVideo from "@/components/OverlayTaticoVideo";

type ReprodutorVideoProps = {
  url: string;
  aoAtualizarTempo: (segundos: number) => void;
};

type YouTubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setPlaybackRate: (rate: number) => void;
};

type YouTubePlayerEvent = {
  data?: number;
  target: YouTubePlayer;
};

type YouTubeNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      height?: string;
      width?: string;
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: (event: YouTubePlayerEvent) => void;
        onStateChange?: (event: YouTubePlayerEvent) => void;
        onError?: () => void;
      };
    }
  ) => YouTubePlayer;
  PlayerState: {
    BUFFERING: number;
    ENDED: number;
    PAUSED: number;
    PLAYING: number;
  };
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let promessaApiYoutube: Promise<YouTubeNamespace> | null = null;

function alvoEditavel(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName);
}

function carregarApiYoutube(): Promise<YouTubeNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("API do YouTube indisponivel fora do navegador"));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (!promessaApiYoutube) {
    promessaApiYoutube = new Promise<YouTubeNamespace>((resolve, reject) => {
      const scriptExistente = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');

      window.onYouTubeIframeAPIReady = () => {
        if (window.YT) resolve(window.YT);
      };

      if (!scriptExistente) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        script.onerror = () => reject(new Error("Nao foi possivel carregar a API do YouTube"));
        document.head.appendChild(script);
      }
    });
  }

  return promessaApiYoutube;
}

function formatarTempo(totalSegundos: number): string {
  const minutos = Math.floor(totalSegundos / 60)
    .toString()
    .padStart(2, "0");
  const segundos = Math.floor(totalSegundos % 60)
    .toString()
    .padStart(2, "0");
  return `${minutos}:${segundos}`;
}

function extrairYouTubeVideoId(url: string): string | null {
  try {
    const valor = new URL(url);
    const host = valor.hostname.replace("www.", "");

    if (host === "youtu.be") {
      return valor.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (valor.pathname === "/watch") {
        return valor.searchParams.get("v");
      }

      if (valor.pathname.startsWith("/embed/") || valor.pathname.startsWith("/shorts/")) {
        return valor.pathname.split("/").filter(Boolean)[1] ?? null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export default function ReprodutorVideo({ url, aoAtualizarTempo }: ReprodutorVideoProps) {
  const referenciaVideo = useRef<HTMLVideoElement>(null);
  const referenciaYoutube = useRef<HTMLDivElement>(null);
  const referenciaPlayerYoutube = useRef<YouTubePlayer | null>(null);
  const referenciaIntervaloYoutube = useRef<number | null>(null);

  const [estaTocando, setEstaTocando] = useState(false);
  const [tempoAtual, setTempoAtual] = useState(0);
  const [velocidade, setVelocidade] = useState(1);
  const [duracao, setDuracao] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  const youtubeVideoId = useMemo(() => extrairYouTubeVideoId(url), [url]);
  const ehYoutube = Boolean(youtubeVideoId);

  const progresso = useMemo(() => {
    if (!duracao) return 0;
    return (tempoAtual / duracao) * 100;
  }, [tempoAtual, duracao]);

  useEffect(() => {
    if (!ehYoutube || !youtubeVideoId || !referenciaYoutube.current) return;

    let cancelado = false;

    const limparIntervalo = () => {
      if (referenciaIntervaloYoutube.current !== null) {
        window.clearInterval(referenciaIntervaloYoutube.current);
        referenciaIntervaloYoutube.current = null;
      }
    };

    const sincronizarTempo = () => {
      const player = referenciaPlayerYoutube.current;
      if (!player) return;
      const proximoTempo = player.getCurrentTime() || 0;
      const proximaDuracao = player.getDuration() || 0;
      setTempoAtual(proximoTempo);
      setDuracao(proximaDuracao);
      aoAtualizarTempo(proximoTempo);
    };

    carregarApiYoutube()
      .then((YT) => {
        if (cancelado || !referenciaYoutube.current) return;

        referenciaPlayerYoutube.current?.destroy();
        referenciaPlayerYoutube.current = new YT.Player(referenciaYoutube.current, {
          height: "100%",
          width: "100%",
          videoId: youtubeVideoId,
          playerVars: {
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0
          },
          events: {
            onReady: (evento) => {
              evento.target.setPlaybackRate(1);
              setErro(null);
              setDuracao(evento.target.getDuration() || 0);
            },
            onStateChange: (evento) => {
              if (evento.data === YT.PlayerState.PLAYING) {
                setEstaTocando(true);
                limparIntervalo();
                referenciaIntervaloYoutube.current = window.setInterval(sincronizarTempo, 250);
                return;
              }

              if (evento.data === YT.PlayerState.PAUSED || evento.data === YT.PlayerState.ENDED) {
                setEstaTocando(false);
                sincronizarTempo();
                limparIntervalo();
                return;
              }

              if (evento.data === YT.PlayerState.BUFFERING) {
                sincronizarTempo();
              }
            },
            onError: () => {
              setErro("Nao foi possivel reproduzir este video do YouTube. Alguns videos bloqueiam incorporacao.");
              setEstaTocando(false);
              limparIntervalo();
            }
          }
        });
      })
      .catch(() => {
        if (!cancelado) {
          setErro("Nao foi possivel carregar o player do YouTube.");
        }
      });

    return () => {
      cancelado = true;
      limparIntervalo();
      referenciaPlayerYoutube.current?.destroy();
      referenciaPlayerYoutube.current = null;
    };
  }, [aoAtualizarTempo, ehYoutube, youtubeVideoId]);

  useEffect(() => {
    setErro(null);
    setEstaTocando(false);
    setTempoAtual(0);
    setDuracao(0);
  }, [url]);

  useEffect(() => {
    if (ehYoutube) {
      referenciaPlayerYoutube.current?.setPlaybackRate(velocidade);
      return;
    }

    if (referenciaVideo.current) {
      referenciaVideo.current.playbackRate = velocidade;
    }
  }, [ehYoutube, velocidade]);

  const alternarPlayPause = useCallback(async () => {
    if (ehYoutube) {
      const player = referenciaPlayerYoutube.current;
      if (!player) return;

      if (estaTocando) {
        player.pauseVideo();
        setEstaTocando(false);
        return;
      }

      player.playVideo();
      setEstaTocando(true);
      return;
    }

    if (!referenciaVideo.current) return;
    if (estaTocando) {
      referenciaVideo.current.pause();
      setEstaTocando(false);
      return;
    }
    await referenciaVideo.current.play();
    setEstaTocando(true);
  }, [ehYoutube, estaTocando]);

  const buscarTempo = useCallback((valor: number) => {
    if (ehYoutube) {
      const player = referenciaPlayerYoutube.current;
      if (!player) return;
      player.seekTo(valor, true);
      setTempoAtual(valor);
      aoAtualizarTempo(valor);
      return;
    }

    if (!referenciaVideo.current) return;
    referenciaVideo.current.currentTime = valor;
    setTempoAtual(valor);
    aoAtualizarTempo(valor);
  }, [aoAtualizarTempo, ehYoutube]);

  const alterarVelocidade = useCallback((valor: number) => {
    setVelocidade(valor);
  }, []);

  useEffect(() => {
    const aoPressionarTecla = (evento: KeyboardEvent) => {
      if (alvoEditavel(evento.target) || evento.metaKey || evento.ctrlKey || evento.altKey) {
        return;
      }

      const tecla = evento.key.toLowerCase();

      if (tecla === " " || tecla === "k") {
        evento.preventDefault();
        void alternarPlayPause();
        return;
      }

      if (tecla === "j") {
        evento.preventDefault();
        buscarTempo(Math.max(0, tempoAtual - 5));
        return;
      }

      if (tecla === "l") {
        evento.preventDefault();
        buscarTempo(Math.min(duracao || tempoAtual + 5, tempoAtual + 5));
        return;
      }

      if (evento.key === "ArrowLeft") {
        evento.preventDefault();
        buscarTempo(Math.max(0, tempoAtual - 2));
        return;
      }

      if (evento.key === "ArrowRight") {
        evento.preventDefault();
        buscarTempo(Math.min(duracao || tempoAtual + 2, tempoAtual + 2));
        return;
      }

      if (tecla === ",") {
        evento.preventDefault();
        alterarVelocidade(Math.max(0.5, velocidade - 0.25));
        return;
      }

      if (tecla === ".") {
        evento.preventDefault();
        alterarVelocidade(Math.min(2, velocidade + 0.25));
      }
    };

    window.addEventListener("keydown", aoPressionarTecla);
    return () => window.removeEventListener("keydown", aoPressionarTecla);
  }, [alternarPlayPause, buscarTempo, duracao, tempoAtual, velocidade, alterarVelocidade]);

  return (
    <section className="rounded-xl border border-slate-700 bg-panel p-4">
      <div className="relative mb-4 aspect-video overflow-hidden rounded-lg bg-black">
        {ehYoutube ? (
          <div ref={referenciaYoutube} className="absolute inset-0 h-full w-full" />
        ) : (
          <video
            ref={referenciaVideo}
            className="absolute inset-0 h-full w-full bg-black object-contain"
            src={url}
            controls={false}
            onLoadedMetadata={(evento) => setDuracao(evento.currentTarget.duration || 0)}
            onTimeUpdate={(evento) => {
              const proximo = evento.currentTarget.currentTime;
              setTempoAtual(proximo);
              aoAtualizarTempo(proximo);
            }}
            onError={() => setErro("Nao foi possivel carregar o video. Use um arquivo direto (.mp4, .webm) ou um link do YouTube valido.")}
            onPause={() => setEstaTocando(false)}
            onPlay={() => setEstaTocando(true)}
          />
        )}
        <OverlayTaticoVideo resetKey={url} tempoAtual={tempoAtual} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button className="rounded bg-accent px-4 py-2 text-sm font-semibold text-black" onClick={alternarPlayPause}>
            {estaTocando ? "Pause" : "Play"}
          </button>
          <input
            className="w-full"
            type="range"
            min={0}
            max={duracao || 0}
            value={tempoAtual}
            onChange={(evento) => buscarTempo(Number(evento.target.value))}
          />
          <span className="w-28 text-right font-mono text-sm text-slate-300">
            {formatarTempo(tempoAtual)} / {formatarTempo(duracao)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
          <p>Seek: {progresso.toFixed(0)}%</p>
          <label className="flex items-center gap-2">
            Velocidade
            <select
              className="rounded border border-slate-600 bg-slate-900 px-2 py-1"
              value={velocidade}
              onChange={(evento) => alterarVelocidade(Number(evento.target.value))}
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </label>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/45 px-3 py-2 text-xs text-slate-400">
          Atalhos do video: `Espaco/K` play-pause, `J/L` -5s/+5s, `Setas` -2s/+2s, `,` e `.` ajustam a velocidade.
        </div>

        {erro && <p className="rounded border border-amber-500/40 bg-amber-950/30 p-3 text-sm text-amber-200">{erro}</p>}
      </div>
    </section>
  );
}
