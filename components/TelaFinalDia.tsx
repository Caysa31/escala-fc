'use client'

import { useState, useEffect } from 'react'
import { Perfil, Jogador } from '@/lib/types'
import { getResultadoRodada } from '@/lib/perfil'
import { getContratosAtivos, calcularBonusMaximo } from '@/lib/contrato'
import { getPosicaoRanking } from '@/lib/supabase'
import { Flame, Trophy, Zap, Share2, X, ChevronRight, Medal } from 'lucide-react'

interface TelaFinalDiaProps {
  jogadoresDoDia: { rodadaId: number; jogador: Jogador }[]
  perfil: Perfil
  onFechar: () => void
}

export default function TelaFinalDia({ jogadoresDoDia, perfil, onFechar }: TelaFinalDiaProps) {
  const [posicaoRanking, setPosicaoRanking] = useState<number | null>(null)

  // Calcula resultados do dia
  const resultados = jogadoresDoDia.map(({ rodadaId, jogador }) => ({
    rodadaId,
    jogador,
    resultado: getResultadoRodada(rodadaId),
  }))

  const pontosHoje = resultados.reduce((sum, r) => sum + (r.resultado?.pontos ?? 0), 0)
  const acertos = resultados.filter(r => r.resultado?.pistaAcerto != null).length

  const todaysRodadaIds = jogadoresDoDia.map(j => j.rodadaId)
  const contratosHoje = getContratosAtivos().filter(c => todaysRodadaIds.includes(c.rodadaId))
  const bonusPotencialTotal = contratosHoje.reduce((sum, c) => sum + calcularBonusMaximo(c.multiplicador), 0)

  // Busca posição no ranking
  useEffect(() => {
    const usuarioId = typeof window !== 'undefined'
      ? localStorage.getItem('escalafc_supabase_id')
      : null
    if (usuarioId) {
      getPosicaoRanking(usuarioId).then(pos => {
        if (pos.geral > 0) setPosicaoRanking(pos.geral)
      })
    }
  }, [])

  // Textos dinâmicos por desempenho
  const configs = {
    3: { emoji: '🏆', titulo: 'Perfeito! Craque absoluto!', subtitulo: 'Acertou os 3 desafios de hoje.', cor: 'text-yellow-400', bg: 'bg-yellow-950 border-yellow-800' },
    2: { emoji: '🎯', titulo: 'Muito bem! Quase perfeito!', subtitulo: '2 de 3 acertos hoje. Amanhã vai de 3!', cor: 'text-green-400', bg: 'bg-green-950 border-green-800' },
    1: { emoji: '⚽', titulo: 'Boa! 1 acerto hoje!', subtitulo: 'Difícil, mas você jogou. Amanhã vai mais fundo!', cor: 'text-blue-400', bg: 'bg-blue-950 border-blue-800' },
    0: { emoji: '💪', titulo: 'Hoje não foi — mas você jogou!', subtitulo: 'Amanhã são outros jogadores. Você sabe mais do que pensa.', cor: 'text-zinc-400', bg: 'bg-zinc-800 border-zinc-700' },
  }
  const config = configs[acertos as keyof typeof configs] ?? configs[0]

  function gerarTextoCompartilhar() {
    const linhas = resultados.map(({ jogador, resultado }) => {
      const emojis = resultado?.tentativas.map(t =>
        t.status === 'acerto' ? '🟩' : '⬛'
      ).join('') ?? '—'
      return emojis
    }).join(' ')
    return `⚽ ESCALA FC — ${acertos}/3 acertos hoje!\n${linhas}\n\nFiz ${pontosHoje} pts. Você consegue mais?\nhttps://escala-fc-app2.vercel.app`
  }

  function compartilhar() {
    const texto = gerarTextoCompartilhar()
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  function desafiarAmigo() {
    const texto = `⚽ Você conhece futebol? Fiz ${pontosHoje} pts hoje no ESCALA FC — consegue me superar?\nhttps://escala-fc-app2.vercel.app`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-3">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm max-h-[95vh] overflow-y-auto">

        {/* Botão fechar */}
        <div className="flex justify-end p-4 pb-0">
          <button onClick={onFechar} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pb-6 space-y-5">

          {/* ── HERO ─────────────────────────────────────── */}
          <div className={`rounded-2xl border p-5 text-center space-y-2 ${config.bg}`}>
            <p className="text-5xl">{config.emoji}</p>
            <p className={`text-xl font-black ${config.cor}`}>{config.titulo}</p>
            <p className="text-zinc-400 text-sm">{config.subtitulo}</p>
          </div>

          {/* ── PLACAR DO DIA ────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-800 rounded-xl p-3 text-center">
              <Trophy size={16} className="text-yellow-400 mx-auto mb-1" />
              <p className="text-yellow-400 font-black text-2xl">{pontosHoje}</p>
              <p className="text-zinc-500 text-xs">pts hoje</p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-white">{acertos}<span className="text-zinc-500 text-base">/3</span></p>
              <p className="text-zinc-500 text-xs mt-1">acertos</p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-3 text-center">
              <Flame size={16} className="text-orange-400 mx-auto mb-1" />
              <p className="text-orange-400 font-black text-2xl">{perfil.streakAtual}</p>
              <p className="text-zinc-500 text-xs">streak</p>
            </div>
          </div>

          {/* ── RANKING GLOBAL ───────────────────────────── */}
          <div className="bg-zinc-800 rounded-xl p-4 flex items-center gap-3">
            <Medal size={22} className="text-yellow-400 shrink-0" />
            <div className="flex-1">
              <p className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Ranking global</p>
              <p className="text-white font-bold text-sm mt-0.5">
                {posicaoRanking
                  ? `#${posicaoRanking} entre todos os jogadores`
                  : `${perfil.pontosTotal} pts no total`
                }
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-zinc-500 text-xs">total</p>
              <p className="text-green-400 font-black text-lg">{perfil.pontosTotal}</p>
            </div>
          </div>

          {/* ── DESAFIOS DO DIA ──────────────────────────── */}
          <div className="space-y-2">
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Seus desafios hoje</p>
            {resultados.map(({ rodadaId, jogador, resultado }) => {
              const ganhou = resultado?.pistaAcerto != null
              const pontos = resultado?.pontos ?? 0
              const emojis = resultado?.tentativas.map(t =>
                t.status === 'acerto' ? '🟩' : '⬛'
              ).join('') ?? ''
              return (
                <div
                  key={rodadaId}
                  className={`flex items-center gap-3 rounded-xl p-3 border ${
                    ganhou ? 'bg-green-950/60 border-green-900' : 'bg-zinc-800 border-zinc-700'
                  }`}
                >
                  <span className="text-xl shrink-0">{jogador.bandeira}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate">{jogador.nome}</p>
                    <p className="text-zinc-500 text-xs">{emojis || '—'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {ganhou ? (
                      <>
                        <p className="text-green-400 font-black text-sm">+{pontos}</p>
                        <p className="text-zinc-500 text-xs">pista {resultado?.pistaAcerto}</p>
                      </>
                    ) : (
                      <p className="text-zinc-600 text-xs">0 pts</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── CONTRATOS ATIVOS ─────────────────────────── */}
          {contratosHoje.length > 0 && (
            <div className="bg-yellow-950 border border-yellow-900 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-yellow-400" />
                <p className="text-yellow-300 font-bold text-sm">Contratos ativos hoje</p>
              </div>
              <p className="text-zinc-400 text-xs">
                Você fechou contrato com {contratosHoje.length === 1 ? 'um jogador' : `${contratosHoje.length} jogadores`}.
                O bônus é calculado automaticamente após as partidas.
              </p>
              {contratosHoje.map(c => (
                <div key={c.id} className="flex items-center gap-2">
                  <span className="text-base">{c.bandeira}</span>
                  <div className="flex-1">
                    <p className="text-white text-xs font-bold">{c.nomeJogador}</p>
                    <p className="text-zinc-500 text-xs">{c.multiplicador}× multiplicador</p>
                  </div>
                  <p className="text-yellow-400 font-bold text-sm">até +{calcularBonusMaximo(c.multiplicador)} pts</p>
                </div>
              ))}
              <div className="border-t border-yellow-900 pt-2 flex justify-between items-center">
                <p className="text-yellow-500 text-xs">Bônus potencial total</p>
                <p className="text-yellow-400 font-black text-lg">+{bonusPotencialTotal} pts</p>
              </div>
            </div>
          )}

          {/* ── CTAs ─────────────────────────────────────── */}
          <div className="space-y-2">
            <button
              onClick={compartilhar}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl py-4 text-sm transition-colors"
            >
              <Share2 size={16} />
              Compartilhar resultado no WhatsApp
            </button>
            <button
              onClick={desafiarAmigo}
              className="w-full flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
            >
              ⚔️ Desafiar um amigo
              <ChevronRight size={14} className="text-zinc-400" />
            </button>
          </div>

          {/* ── MOTIVAÇÃO PRO DIA SEGUINTE ───────────────── */}
          <div className="text-center space-y-1 py-1">
            <p className="text-white font-bold">🔔 Novos desafios amanhã!</p>
            <p className="text-zinc-500 text-xs">
              {perfil.streakAtual > 1
                ? `Você está em ${perfil.streakAtual} dias seguidos. Não deixe apagar!`
                : 'Volte amanhã e comece sua sequência de acertos.'}
            </p>
            <p className="text-zinc-600 text-xs pt-1">
              Pontuação total: <span className="text-zinc-400 font-semibold">{perfil.pontosTotal} pts</span>
              {posicaoRanking ? ` · #${posicaoRanking} no ranking` : ''}
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
