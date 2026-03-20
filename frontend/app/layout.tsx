import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "StatKick",
  description: "MVP de analise de futebol por video e eventos"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
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
        </div>
        {children}
      </body>
    </html>
  );
}
