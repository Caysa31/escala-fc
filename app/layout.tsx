import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "COBRA DA BOLA — Quem é o Craque?",
  description: "Jogo diário de futebol brasileiro: adivinhe o jogador com o mínimo de pistas. Prove que você é cobra no assunto!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* Fundo de estádio — div fixo funciona no iOS onde background-attachment:fixed falha */}
        <div style={{ position: 'fixed', inset: 0, zIndex: -2, backgroundImage: "url('/assets/stadium-bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center top' }} aria-hidden="true" />
        <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: 'rgba(4, 9, 20, 0.90)' }} aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
