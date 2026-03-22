import "./globals.css";
import type { Metadata } from "next";

import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "StatKick",
  description: "MVP de analise de futebol por video e eventos"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
