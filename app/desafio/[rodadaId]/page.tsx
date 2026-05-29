'use client'

import { use } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import jogadoresData from '@/data/jogadores.json'
import { Jogador } from '@/lib/types'
import { getIntroNarrativa } from '@/lib/game'
import { PONTOS_BASE } from '@/lib/types'
import Link from 'next/link'
import { Trophy, ArrowRight } from 'lucide-react'

const jogadores = jogadoresData as Jogador[]

function getJogadorDaRodada(rodadaId: number): Jogador {
  const indice = Math.abs(rodadaId - 1) % jogadores.length
  return jogadores[indice]
}

function DesafioConteudo({ rodadaId }: { rodadaId: number }) {
  const params = useSearchParams()

  // Resultado do amigo vindo da URL
  const pistaAcerto = parseInt(params.get('p') ?? '0', 10) || null
  const tentativasStr = params.get('t') ?? ''
  const tentativas = tentativasStr.split('').map(c => c === '1' ? '🟩' : '⬛')

  const jogador = getJogadorDaRodada(rodadaId)
  const intro = getIntroNarrativa(jogador)
  const pontos = pistaAcerto ? (PONTOS_BASE[pistaAcerto] ?? 0) : 0

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-5">

        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-3xl">⚽</p>
          <h1 className="text-2xl font-black">ESCALA FC</h1>
          <p className="text-zinc-400 text-sm">Rodada #{rodadaId}</p>
        </div>

        {/* Card do resultado do amigo */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-4">
          <p className="text-yellow-400 text-sm font-bold text-center">
            🏆 Seu amigo te desafiou!
          </p>

          {/* Emoji grid */}
          {tentativas.length > 0 && (
            <div className="text-center">
              <p className="text-3xl tracking-widest">{tentativas.join('')}</p>
            </div>
          )}

          {/* Pontuação do amigo */}
          {pistaAcerto ? (
            <div className="flex items-center gap-3 bg-green-950 border border-green-800 rounded-xl px-4 py-3">
              <Trophy size={20} className="text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-green-300 font-bold text-sm">
                  Acertou na pista {pistaAcerto}!
                </p>
                <p className="text-green-600 text-xs">+{pontos} pontos · Você consegue superar?</p>
              </div>
            </div>
          ) : tentativas.length > 0 ? (
            <div className="bg-zinc-800 rounded-xl px-4 py-3 text-center">
              <p className="text-zinc-400 text-sm">Não acertou desta vez — mas tentou!</p>
              <p className="text-zinc-500 text-xs mt-0.5">Será que você vai melhor?</p>
            </div>
          ) : null}
        </div>

        {/* Teaser do jogador */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4 space-y-2">
          <p className="text-xs uppercase font-bold tracking-widest text-zinc-500">
            ⚡ Jogador do dia
          </p>
          <p className="text-zinc-200 text-sm italic leading-relaxed">
            &ldquo;{intro}&rdquo;
          </p>
          <p className="text-zinc-600 text-xs">Você sabe quem é?</p>
        </div>

        {/* CTA principal */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl py-4 text-base transition-all"
        >
          Aceitar o desafio
          <ArrowRight size={18} />
        </Link>

        <p className="text-center text-zinc-600 text-xs">
          Jogue os 3 desafios do dia, acumule pontos e entre no ranking global
        </p>
      </div>
    </main>
  )
}

export default function DesafioPage({ params }: { params: Promise<{ rodadaId: string }> }) {
  const { rodadaId: rodadaIdStr } = use(params)
  const rodadaId = parseInt(rodadaIdStr, 10)

  return (
    <Suspense fallback={
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">Carregando...</p>
      </main>
    }>
      <DesafioConteudo rodadaId={rodadaId} />
    </Suspense>
  )
}
