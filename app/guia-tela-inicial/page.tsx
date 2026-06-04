'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

const passosIphone = [
  {
    img: '/images/guia/passo1.jpg',
    numero: 1,
    instrucao: 'Toque nos 3 pontinhos (•••) no canto inferior direito do Safari — indicado pelo círculo vermelho',
  },
  {
    img: '/images/guia/passo2.jpg',
    numero: 2,
    instrucao: 'Um menu aparece. Toque em "Compartilhar" — indicado pelo círculo vermelho',
  },
  {
    img: '/images/guia/passo3.jpg',
    numero: 3,
    instrucao: 'A janela de compartilhamento abre. Toque em "Ver Mais" para expandir as opções — círculo vermelho',
  },
  {
    img: '/images/guia/passo4.jpg',
    numero: 4,
    instrucao: 'Role até o final e toque em "Adicionar à Tela de Início" — indicado pelo círculo vermelho',
  },
  {
    img: '/images/guia/passo5.jpg',
    numero: 5,
    instrucao: 'Confirme o nome e toque em "Adicionar" (azul) no canto superior direito — círculo vermelho',
  },
]

const passosAndroid = [
  {
    numero: 1,
    instrucao: 'Abra o jogo no Chrome e toque nos 3 pontinhos (⋮) no canto superior direito da tela',
    icon: '⋮',
  },
  {
    numero: 2,
    instrucao: 'No menu que abrir, procure e toque em "Adicionar à tela inicial"',
    icon: '📱',
  },
  {
    numero: 3,
    instrucao: 'Uma janela de confirmação aparece com o nome "COBRA — Quem é o Craque?". Toque em "Adicionar"',
    icon: '✅',
  },
  {
    numero: 4,
    instrucao: 'Pronto! O ícone COBRA aparece na sua tela inicial. Toque nele para jogar amanhã 🐍',
    icon: '🐍',
  },
]

export default function GuiaTelaPrincipal() {
  const router = useRouter()
  const [sistema, setSistema] = useState<'iphone' | 'android'>('iphone')

  return (
    <main className="min-h-screen bg-[#0A1626] text-white">
      <div className="max-w-md mx-auto px-4 pt-5 pb-28 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-[#0F1D30] border border-[#1A3A5C] shrink-0"
          >
            <ArrowLeft size={18} className="text-[#8AB4CC]" />
          </button>
          <div className="w-9 shrink-0" />
        </div>

        {/* Título destacado */}
        <div className="text-center space-y-1 py-2">
          <p className="text-4xl">📲</p>
          <h1 className="text-2xl font-black text-white">Como salvar na tela inicial</h1>
          <p className="text-[#8AB4CC] text-sm">Acesse o jogo direto pelo ícone, como um app</p>
        </div>

        {/* Tabs iPhone / Android */}
        <div className="flex bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-1 gap-1">
          <button
            onClick={() => setSistema('iphone')}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              sistema === 'iphone'
                ? 'bg-[#00C853] text-[#0A1626]'
                : 'text-[#8AB4CC] hover:text-white'
            }`}
          >
            🍎 iPhone
          </button>
          <button
            onClick={() => setSistema('android')}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              sistema === 'android'
                ? 'bg-[#00C853] text-[#0A1626]'
                : 'text-[#8AB4CC] hover:text-white'
            }`}
          >
            🤖 Android
          </button>
        </div>

        {/* Passos iPhone */}
        {sistema === 'iphone' && (
          <div className="space-y-6">
            {passosIphone.map((passo) => (
              <div key={passo.numero} className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#00C853] flex items-center justify-center text-[#0A1626] font-black text-sm shrink-0 mt-0.5">
                    {passo.numero}
                  </div>
                  <p className="text-white text-sm leading-snug">{passo.instrucao}</p>
                </div>
                <div className="rounded-2xl overflow-hidden border border-[#2A5275] mx-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={passo.img}
                    alt={`Passo ${passo.numero}`}
                    className="w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Passos Android */}
        {sistema === 'android' && (
          <div className="space-y-4">
            <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl px-4 py-3">
              <p className="text-[#8AB4CC] text-xs">
                💡 No Android, abra o jogo no <span className="text-white font-semibold">Chrome</span> para ter a opção de adicionar à tela inicial.
              </p>
            </div>
            {passosAndroid.map((passo) => (
              <div key={passo.numero} className="flex items-start gap-4 bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl p-4">
                <div className="w-10 h-10 rounded-full bg-[#00C853] flex items-center justify-center text-[#0A1626] font-black text-sm shrink-0">
                  {passo.numero}
                </div>
                <div className="flex-1">
                  <p className="text-2xl mb-1">{passo.icon}</p>
                  <p className="text-white text-sm leading-snug">{passo.instrucao}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Botão flutuante fixo no rodapé */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#070E1A] border-t border-[#1A3A5C] px-4 pt-3 pb-6">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => {
              window.close()
              // Fallback se window.close() não funcionar (ex: aba original)
              setTimeout(() => router.push('/'), 100)
            }}
            className="w-full bg-[#0F1D30] border border-[#1A3A5C] hover:border-[#00C853]/30 text-white font-bold py-4 rounded-xl text-sm transition-all active:scale-95"
          >
            ← Voltar para meus resultados
          </button>
        </div>
      </div>
    </main>
  )
}
