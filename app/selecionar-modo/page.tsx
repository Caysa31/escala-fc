'use client'

import { useRouter } from 'next/navigation'
import { MODES, setModeAtual, GameMode } from '@/lib/gameMode'

export default function SelecionarModo() {
  const router = useRouter()

  function escolher(mode: GameMode) {
    setModeAtual(mode)
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#0A1626] flex flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-black text-white tracking-widest">COBRA DA BOLA</h1>
          <p className="text-[#8AB4CC] text-sm">Escolha o seu jogo</p>
        </div>

        {/* Cards de modo */}
        <div className="space-y-3">

          {/* Copa do Mundo */}
          <button
            onClick={() => escolher('copa')}
            className="w-full bg-[#0F1D30] border-2 border-[#FFD23F]/40 hover:border-[#FFD23F] rounded-2xl p-5 text-left transition-all active:scale-[0.98] group"
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

          {/* Brasileirão */}
          <button
            onClick={() => escolher('bola')}
            className="w-full bg-[#0F1D30] border-2 border-[#00C853]/40 hover:border-[#00C853] rounded-2xl p-5 text-left transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">🐍</span>
              <div className="flex-1">
                <p className="text-white font-black text-lg tracking-wider">COBRA DA BOLA</p>
                <p className="text-[#00C853] text-xs font-semibold tracking-wider">QUEM É O CRAQUE?</p>
                <p className="text-[#8AB4CC] text-xs mt-1">Brasileirão e grandes ligas do mundo</p>
              </div>
            </div>
          </button>

        </div>

        <p className="text-center text-[#5A8AAA] text-xs">
          Sua conta funciona nos dois jogos
        </p>
      </div>
    </div>
  )
}
