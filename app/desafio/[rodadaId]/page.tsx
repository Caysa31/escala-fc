'use client'

import { use } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { getIntroNarrativa, getJogadorPorRodadaId } from '@/lib/game'
import { PONTOS_BASE } from '@/lib/types'
import Link from 'next/link'
import { Trophy, ArrowRight } from 'lucide-react'

function DesafioConteudo({ rodadaId }: { rodadaId: number }) {
  const params = useSearchParams()

  const pistaAcerto = parseInt(params.get('p') ?? '0', 10) || null
  const tentativasStr = params.get('t') ?? ''
  const tentativas = tentativasStr.split('').map(c => c === '1' ? '🟩' : '⬛')

  const jogador = getJogadorPorRodadaId(rodadaId)

  if (!jogador) {
    return (
      <main className="min-h-screen bg-[#0A1626] text-white flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <p className="text-4xl">🐍</p>
          <p className="text-white font-bold">Desafio não encontrado</p>
          <p className="text-[#8AB4CC] text-sm">Este link pode estar desatualizado.</p>
          <Link href="/" className="inline-block mt-2 bg-[#00C853] hover:bg-[#00E060] text-[#0A1626] font-bold rounded-xl px-6 py-3 text-sm transition-all">
            Jogar agora
          </Link>
        </div>
      </main>
    )
  }

  const intro = getIntroNarrativa(jogador)
  const pontos = pistaAcerto ? (PONTOS_BASE[pistaAcerto] ?? 0) : 0
  const pistaLabel = pistaAcerto === 0 ? 'pelo histórico' : pistaAcerto ? `na pista ${pistaAcerto}` : null

  return (
    <main className="min-h-screen bg-[#0A1626] text-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-4">

        {/* Header COBRA */}
        <div className="text-center space-y-1">
          <p className="text-4xl">🐍</p>
          <h1 className="text-3xl font-black tracking-widest">COBRA</h1>
          <p className="text-[#00C853] text-xs font-semibold tracking-wider">QUEM É O CRAQUE?</p>
        </div>

        {/* Card resultado do amigo */}
        <div className="bg-[#0F1D30] border border-[#2A5275] rounded-2xl p-5 space-y-4">
          <p className="text-[#8AB4CC] text-sm font-semibold text-center">
            ⚔️ Seu amigo te desafiou!
          </p>

          {tentativas.length > 0 && (
            <div className="text-center">
              <p className="text-3xl tracking-widest">{tentativas.join('')}</p>
            </div>
          )}

          {pistaAcerto ? (
            <div className="flex items-center gap-3 bg-[#071A0F] border border-[#00C853]/30 rounded-xl px-4 py-3">
              <Trophy size={20} className="text-[#FFD23F] flex-shrink-0" />
              <div>
                <p className="text-white font-bold text-sm">
                  Acertou {pistaLabel}!
                </p>
                <p className="text-[#FFD23F] font-black text-lg">+{pontos} pts</p>
                <p className="text-[#8AB4CC] text-xs">Você consegue superar?</p>
              </div>
            </div>
          ) : tentativas.length > 0 ? (
            <div className="bg-[#0A1626] border border-[#1A3A5C] rounded-xl px-4 py-3 text-center">
              <p className="text-[#8AB4CC] text-sm">Não acertou desta vez — mas tentou!</p>
              <p className="text-[#5A8AAA] text-xs mt-0.5">Será que você vai melhor?</p>
            </div>
          ) : null}
        </div>

        {/* Teaser do jogador */}
        <div className="bg-[#0F1D30] border border-[#2A5275] rounded-2xl px-5 py-4 space-y-2">
          <p className="text-xs uppercase font-bold tracking-widest text-[#8AB4CC]">
            ⚡ Jogador do dia
          </p>
          <p className="text-white text-sm italic leading-relaxed">
            &ldquo;{intro}&rdquo;
          </p>
          <p className="text-[#8AB4CC] text-xs">Você sabe quem é?</p>
        </div>

        {/* CTA */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full bg-[#00C853] hover:bg-[#00E060] text-[#0A1626] font-black rounded-xl py-4 text-base transition-all"
        >
          Aceitar o desafio
          <ArrowRight size={18} />
        </Link>

        <p className="text-center text-[#5A8AAA] text-xs">
          Jogue os 3 desafios do dia, acumule pontos e entre no ranking global
        </p>
      </div>
    </main>
  )
}

export default function DesafioPage({ params }: { params: Promise<{ rodadaId: string }> }) {
  const { rodadaId: rodadaIdStr } = use(params)
  const rodadaId = parseInt(rodadaIdStr, 10)
  const rodadaIdSafe = Number.isFinite(rodadaId) ? rodadaId : -1

  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0A1626] flex items-center justify-center">
        <div className="text-[#00C853] font-black text-xl animate-pulse">🐍 COBRA</div>
      </main>
    }>
      <DesafioConteudo rodadaId={rodadaIdSafe} />
    </Suspense>
  )
}
