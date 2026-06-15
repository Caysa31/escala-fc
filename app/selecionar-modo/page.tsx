'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { setModeAtual } from '@/lib/gameMode'

export default function SelecionarModo() {
  const router = useRouter()

  // Garante que o modo copa sempre está salvo ao entrar nessa tela
  useEffect(() => {
    setModeAtual('copa')
  }, [])

  function jogarCopa() {
    setModeAtual('copa')
    router.push('/')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-black text-white tracking-widest">COBRA DA BOLA</h1>
          <p className="text-[#8AB4CC] text-sm">Escolha o seu jogo</p>
        </div>

        {/* Cards de modo */}
        <div className="space-y-3">

          {/* Copa do Mundo — ATIVO */}
          <button
            onClick={jogarCopa}
            className="w-full bg-[#0F1D30] border-2 border-[#FFD23F] hover:border-[#FFD23F] rounded-2xl p-5 text-left transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">⚽</span>
              <div className="flex-1">
                <p className="text-white font-black text-lg tracking-wider">COBRA DA COPA</p>
                <p className="text-[#FFD23F] text-xs font-semibold tracking-wider">QUEM É O CRAQUE?</p>
                <p className="text-[#8AB4CC] text-xs mt-1">Copa do Mundo 2026 · 41 seleções</p>
              </div>
              <div className="bg-[#FFD23F]/10 border border-[#FFD23F]/30 rounded-xl px-3 py-1.5">
                <p className="text-[#FFD23F] text-xs font-bold">AO VIVO</p>
              </div>
            </div>
          </button>

          {/* Brasileirão — BLOQUEADO */}
          <div className="w-full bg-[#0A1020] border-2 border-[#1A3A5C]/50 rounded-2xl p-5 opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-4">
              <span className="text-4xl grayscale">🐍</span>
              <div className="flex-1">
                <p className="text-[#8AB4CC] font-black text-lg tracking-wider">COBRA DA BOLA</p>
                <p className="text-[#4A6A8A] text-xs font-semibold tracking-wider">QUEM É O CRAQUE?</p>
                <p className="text-[#2A4A6A] text-xs mt-1">Brasileirão e grandes ligas do mundo</p>
              </div>
              <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl px-3 py-1.5">
                <p className="text-[#4A6A8A] text-xs font-bold">PÓS-COPA</p>
              </div>
            </div>
          </div>

        </div>

        <p className="text-center text-[#5A8AAA] text-xs">
          Sua conta funciona nos dois jogos
        </p>
      </div>
    </div>
  )
}
