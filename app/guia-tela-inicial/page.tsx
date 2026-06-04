'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function GuiaTelaPrincipal() {
  const router = useRouter()

  const passos = [
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
      instrucao: 'A janela de compartilhamento abre. Role para baixo (seta vermelha) para ver mais opções',
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

  return (
    <main className="min-h-screen bg-[#0A1626] text-white">
      <div className="max-w-md mx-auto px-4 pt-5 pb-10 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-[#0F1D30] border border-[#1A3A5C] shrink-0"
          >
            <ArrowLeft size={18} className="text-[#8AB4CC]" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-black">📲 Como salvar na tela inicial</h1>
            <p className="text-[#8AB4CC] text-xs mt-0.5">Passo a passo para iPhone</p>
          </div>
          <div className="w-9 shrink-0" />
        </div>

        {/* Passos */}
        {passos.map((passo) => (
          <div key={passo.numero} className="space-y-3">
            {/* Número do passo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#00C853] flex items-center justify-center text-[#0A1626] font-black text-sm shrink-0">
                {passo.numero}
              </div>
              <p className="text-white text-sm font-semibold leading-snug">{passo.instrucao}</p>
            </div>

            {/* Screenshot */}
            <div className="rounded-2xl overflow-hidden border border-[#2A5275]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={passo.img}
                alt={`Passo ${passo.numero}`}
                className="w-full"
              />
            </div>
          </div>
        ))}

        {/* Botão voltar */}
        <button
          onClick={() => router.back()}
          className="w-full bg-[#0F1D30] border border-[#1A3A5C] hover:border-[#00C853]/30 text-white font-bold py-4 rounded-xl text-sm transition-all active:scale-95"
        >
          ← Voltar para meus resultados
        </button>

      </div>
    </main>
  )
}
