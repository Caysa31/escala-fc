'use client'

import Link from 'next/link'
import { ArrowLeft, Lock } from 'lucide-react'
import { getModeAtual } from '@/lib/gameMode'
import { MODOS_CONFIG, getModoPlaysHoje, MAX_PLAYS_POR_DIA, getTreinoJogosHoje, getBonusAmanha } from '@/lib/modos'
import BottomNav from '@/components/BottomNav'

export default function ModosPage() {
  const treinoHoje = getTreinoJogosHoje()
  const bonusAmanha = getBonusAmanha()

  return (
    <main className="min-h-screen text-white">
      <div className="max-w-md mx-auto px-4 pt-5 pb-28 space-y-4">

        {/* Header */}
        <header className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-[#0F1D30] border border-[#1A3A5C] hover:border-[#00C853]/30 transition-all shrink-0">
            <ArrowLeft size={18} className="text-[#8AB4CC]" />
          </Link>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-black tracking-tight">🎮 Modos de Jogo</h1>
            <p className="text-[#8AB4CC] text-xs mt-0.5">Puzzles ilimitados · treina enquanto espera o dia virar</p>
          </div>
          {/* Espaço para equilibrar o botão de voltar */}
          <div className="w-9 shrink-0" />
        </header>
        <div className="h-px bg-gradient-to-r from-transparent via-[#1A3A5C] to-transparent" />

        {/* Aviso */}
        <div className="bg-[#0F1D30] border border-[#1A3A5C] border-l-2 border-l-[#00C853] rounded-xl px-4 py-4 text-center">
          <p className="text-white font-black text-lg">{MAX_PLAYS_POR_DIA} partidas por modo</p>
          <p className="text-[#8AB4CC] text-xs mt-1">Vitórias aqui valem pontos extras amanhã</p>
        </div>

        {/* Bônus de treino — borda lateral dourada quando ativo */}
        <div className={`bg-[#0F1D30] border border-[#1A3A5C] rounded-xl px-4 py-3 flex items-center justify-between ${bonusAmanha > 1 ? 'border-l-2 border-l-[#FFD23F]' : ''}`}>
          <div>
            <p className="text-white text-sm font-semibold">🏋️ Bônus de treino amanhã</p>
            <p className="text-[#8AB4CC] text-xs mt-0.5">{treinoHoje} {treinoHoje === 1 ? 'jogo' : 'jogos'} hoje</p>
          </div>
          <p className={`font-black text-2xl ${bonusAmanha > 1 ? 'text-[#FFD23F]' : 'text-[#5A8AAA]'}`}>
            ×{bonusAmanha}
          </p>
        </div>

        {/* Cards de modos — todos com mesmo card, sem arco-íris */}
        <div className="space-y-2">
          {MODOS_CONFIG(getModeAtual()).map(modo => {
            const playsHoje = getModoPlaysHoje(modo.id)
            const restantes = MAX_PLAYS_POR_DIA - playsHoje
            const esgotado = restantes <= 0

            return (
              <Link
                key={modo.id}
                href={esgotado ? '#' : `/modos/${modo.id}`}
                className={`flex items-center gap-4 bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl px-4 py-4 transition-all ${
                  esgotado
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:border-[#00C853]/30 active:scale-[0.99]'
                }`}
              >
                {/* Emoji grande */}
                <span className="text-3xl shrink-0">{modo.emoji}</span>

                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">{modo.label}</p>
                  <p className="text-[#8AB4CC] text-xs mt-0.5 leading-snug">{modo.descricao}</p>
                  {modo.totalPistas && (
                    <span className="text-[10px] text-[#8AB4CC] border border-[#1A3A5C] rounded px-1.5 py-0.5 mt-1 inline-block">
                      ⚡ {modo.totalPistas} pistas
                    </span>
                  )}
                </div>

                {/* Progresso X/MAX */}
                <div className="shrink-0 text-right space-y-1">
                  {esgotado ? (
                    <>
                      <Lock size={14} className="text-[#5A8AAA] ml-auto" />
                      <p className="text-[#5A8AAA] text-[10px]">concluído</p>
                    </>
                  ) : (
                    <>
                      <p className="text-white font-black text-sm leading-none">
                        {playsHoje}
                        <span className="text-[#5A8AAA] font-normal">/{MAX_PLAYS_POR_DIA}</span>
                      </p>
                      <p className="text-[#8AB4CC] text-[10px]">hoje</p>
                    </>
                  )}
                  {/* Mini barra de progresso */}
                  <div className="w-12 h-1 bg-[#1A3A5C] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#00C853] rounded-full transition-all"
                      style={{ width: `${(playsHoje / MAX_PLAYS_POR_DIA) * 100}%` }}
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <p className="text-center text-[#5A8AAA] text-xs pb-4">
          Novos desafios disponíveis todo dia à meia-noite
        </p>
      </div>
      <BottomNav />
    </main>
  )
}
