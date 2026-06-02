'use client'

import Link from 'next/link'
import { ArrowLeft, Lock } from 'lucide-react'
import { MODOS_CONFIG, getModoPlaysHoje, MAX_PLAYS_POR_DIA } from '@/lib/modos'

export default function ModosPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-md mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-all"
          >
            <ArrowLeft size={18} className="text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-tight">Modos de Jogo</h1>
            <p className="text-zinc-500 text-xs">Puzzles ilimitados — treina enquanto espera o dia virar</p>
          </div>
        </div>

        {/* Aviso */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3">
          <p className="text-zinc-400 text-xs leading-relaxed">
            🎮 Cada modo tem até <span className="text-white font-bold">{MAX_PLAYS_POR_DIA} partidas por dia</span>.
            Pontos ganhos aqui contam para o seu total. Sequência só conta no desafio diário.
          </p>
        </div>

        {/* Cards de modos */}
        <div className="space-y-3">
          {MODOS_CONFIG.map(modo => {
            const playsHoje = getModoPlaysHoje(modo.id)
            const restantes = MAX_PLAYS_POR_DIA - playsHoje
            const esgotado = restantes <= 0

            return (
              <Link
                key={modo.id}
                href={esgotado ? '#' : `/modos/${modo.id}`}
                className={`block rounded-2xl border p-5 transition-all ${modo.corFundo} ${modo.corBorda} ${
                  esgotado
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{modo.emoji}</span>
                      <h2 className={`font-black text-base ${modo.corTexto}`}>{modo.label}</h2>
                    </div>
                    <p className="text-zinc-300 text-sm leading-relaxed">{modo.descricao}</p>

                    {modo.totalPistas && (
                      <div className="mt-2">
                        <span className="text-xs font-bold bg-red-900/60 text-red-300 px-2 py-0.5 rounded-full border border-red-800">
                          ⚡ {modo.totalPistas} pistas
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    {esgotado ? (
                      <div className="flex flex-col items-center gap-1">
                        <Lock size={16} className="text-zinc-500" />
                        <span className="text-zinc-500 text-xs">amanhã</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-lg font-black ${modo.corTexto}`}>{restantes}</span>
                        <span className="text-zinc-500 text-xs">restantes</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Rodapé */}
        <p className="text-center text-zinc-600 text-xs pb-4">
          Novos jogadores disponíveis todo dia à meia-noite
        </p>

      </div>
    </main>
  )
}
