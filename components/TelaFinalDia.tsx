'use client'

import { Perfil, Jogador, MULTIPLICADORES_CONTRATO } from '@/lib/types'
import { getResultadoRodada } from '@/lib/perfil'
import { getContratosAtivos, calcularBonusMaximo } from '@/lib/contrato'
import { Flame, Trophy, Zap, Share2, X, CheckCircle, XCircle } from 'lucide-react'
import { gerarTextoCompartilhar } from '@/lib/game'

interface TelaFinalDiaProps {
  jogadoresDoDia: { rodadaId: number; jogador: Jogador }[]
  perfil: Perfil
  onFechar: () => void
}

export default function TelaFinalDia({ jogadoresDoDia, perfil, onFechar }: TelaFinalDiaProps) {
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

  const headerEmoji = acertos === 3 ? '🏆' : acertos === 2 ? '🎯' : acertos === 1 ? '⚽' : '😬'
  const headerTexto =
    acertos === 3 ? 'Perfeito! Acertou os 3!' :
    acertos === 2 ? '2 de 3 — muito bom!' :
    acertos === 1 ? '1 de 3 — tente mais amanhã!' :
    'Nenhum hoje — amanhã é outro dia!'

  function compartilharDia() {
    const linhas = resultados.map(({ rodadaId, jogador, resultado }) => {
      const emojis = resultado?.tentativas.map(t => t.status === 'acerto' ? '🟩' : '⬛').join('') ?? '—'
      return `ESCALA FC #${rodadaId} (${jogador.nome})\n${emojis}`
    })
    const texto = `⚽ ESCALA FC — ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}\n${acertos}/3 acertos · ${pontosHoje} pts\n\n${linhas.join('\n\n')}\nescalafe.com.br`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm p-5 space-y-4 max-h-[92vh] overflow-y-auto">

        {/* Fechar */}
        <div className="flex justify-end">
          <button onClick={onFechar} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Header do dia */}
        <div className="text-center space-y-1 -mt-2">
          <p className="text-4xl">{headerEmoji}</p>
          <p className="text-white font-black text-lg">{headerTexto}</p>
          <p className="text-zinc-500 text-xs">Rodada do dia encerrada</p>
        </div>

        {/* Pontos + streak */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-800 rounded-xl p-3 text-center">
            <Trophy size={16} className="text-yellow-400 mx-auto mb-1" />
            <p className="text-yellow-400 font-black text-xl">{pontosHoje}</p>
            <p className="text-zinc-500 text-xs">pts hoje</p>
          </div>
          <div className="bg-zinc-800 rounded-xl p-3 text-center">
            <Flame size={16} className="text-orange-400 mx-auto mb-1" />
            <p className="text-orange-400 font-black text-xl">{perfil.streakAtual}</p>
            <p className="text-zinc-500 text-xs">dias seguidos</p>
          </div>
        </div>

        {/* Resumo dos 3 desafios */}
        <div className="space-y-2">
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Seus desafios</p>
          {resultados.map(({ rodadaId, jogador, resultado }, i) => {
            const ganhou = resultado?.pistaAcerto != null
            const pontos = resultado?.pontos ?? 0
            return (
              <div
                key={rodadaId}
                className={`flex items-center gap-3 rounded-xl p-3 border ${
                  ganhou
                    ? 'bg-green-950 border-green-800'
                    : 'bg-zinc-800 border-zinc-700'
                }`}
              >
                <span className="text-xl">{jogador.bandeira}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">{jogador.nome}</p>
                  <p className="text-zinc-400 text-xs">{jogador.posicao} · {jogador.clube}</p>
                </div>
                <div className="text-right shrink-0">
                  {ganhou ? (
                    <>
                      <p className="text-green-400 font-bold text-sm">+{pontos} pts</p>
                      <p className="text-zinc-500 text-xs">pista {resultado?.pistaAcerto}</p>
                    </>
                  ) : (
                    <p className="text-zinc-500 text-xs">Não acertou</p>
                  )}
                </div>
                <div className="shrink-0">
                  {ganhou
                    ? <CheckCircle size={16} className="text-green-400" />
                    : <XCircle size={16} className="text-zinc-600" />
                  }
                </div>
              </div>
            )
          })}
        </div>

        {/* Contratos ativos */}
        {contratosHoje.length > 0 && (
          <div className="space-y-2">
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              Contratos assinados hoje
            </p>
            {contratosHoje.map(c => (
              <div key={c.id} className="flex items-center gap-3 bg-yellow-950 border border-yellow-900 rounded-xl p-3">
                <span className="text-lg">{c.bandeira}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">{c.nomeJogador}</p>
                  <p className="text-zinc-400 text-xs">{c.clube} · {c.multiplicador}× mult.</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-yellow-400 font-bold text-sm">+{calcularBonusMaximo(c.multiplicador)}</p>
                  <p className="text-zinc-500 text-xs">potencial</p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 bg-zinc-800 rounded-xl p-3">
              <Zap size={14} className="text-yellow-400 shrink-0" />
              <p className="text-zinc-300 text-xs">
                Bônus potencial total dos contratos:{' '}
                <span className="text-yellow-400 font-black">+{bonusPotencialTotal} pts</span>
              </p>
            </div>
            <p className="text-zinc-600 text-xs text-center">
              Calculado automaticamente após as partidas
            </p>
          </div>
        )}

        {/* Compartilhar */}
        <button
          onClick={compartilharDia}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl py-3 text-sm transition-colors"
        >
          <Share2 size={16} />
          Compartilhar resultado do dia
        </button>

        {/* Volta amanhã */}
        <div className="text-center space-y-1 pb-1">
          <p className="text-white font-bold text-sm">Novos desafios amanhã 🔔</p>
          <p className="text-zinc-500 text-xs">Volte para manter sua sequência de {perfil.streakAtual} {perfil.streakAtual === 1 ? 'dia' : 'dias'}!</p>
        </div>

      </div>
    </div>
  )
}
