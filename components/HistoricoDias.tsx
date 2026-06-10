'use client'

import { useMemo } from 'react'
import { GameMode } from '@/lib/gameMode'
import { getJogadoresDoDia, getDiffDiasAtual } from '@/lib/game'
import { getResultadoRodada } from '@/lib/perfil'

interface DiaData {
  label: string
  acertos: number
  total: number
  pontos: number
  emojis: string
}

function computeHistorico(mode: GameMode, includeToday: boolean, maxDias: number): DiaData[] {
  const diffAtual = getDiffDiasAtual(mode)
  const historico: DiaData[] = []
  const startOffset = includeToday ? 0 : 1

  for (let i = startOffset; i <= 60 && historico.length < maxDias; i++) {
    const diff = diffAtual - i
    if (diff < 0) break

    const jogadores = getJogadoresDoDia(mode, diff)
    const resultados = jogadores.map(({ rodadaId }) => getResultadoRodada(rodadaId))

    if (!resultados.some(r => r !== null)) continue

    const acertos = resultados.filter(r => r?.pistaAcerto != null).length
    const pontos = resultados.reduce((sum, r) => sum + (r?.pontos ?? 0), 0)
    const emojis = resultados.map(r =>
      r === null ? '⬜' : r.pistaAcerto != null ? '🟩' : '⬛'
    ).join('')

    let label: string
    if (i === 0) label = 'Hoje'
    else if (i === 1) label = 'Ontem'
    else {
      // Calcula a data real do dia para exibir
      const inicio = new Date('2026-05-22T12:00:00') // referência fixa para label
      const data = new Date(inicio.getTime() + (diffAtual - i) * 86400000 - (diffAtual - diff) * 86400000)
      // Mais simples: subtrair i dias de hoje
      const hoje = new Date()
      const dataLabel = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - i)
      label = dataLabel.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }

    historico.push({ label, acertos, total: jogadores.length, pontos, emojis })
  }

  return historico
}

interface Props {
  mode: GameMode
  includeToday?: boolean
  maxDias?: number
}

export default function HistoricoDias({ mode, includeToday = false, maxDias = 7 }: Props) {
  const historico = useMemo(
    () => computeHistorico(mode, includeToday, maxDias),
    [mode, includeToday, maxDias]
  )

  if (historico.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-[#8AB4CC] text-xs font-semibold uppercase tracking-wider px-1">
        Histórico de dias
      </p>
      {historico.map((dia, idx) => (
        <div
          key={idx}
          className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl px-4 py-3 flex items-center gap-3"
        >
          {/* Data */}
          <div className="shrink-0 w-12 text-center">
            <p className="text-white font-bold text-xs leading-tight">{dia.label}</p>
          </div>

          {/* Separador */}
          <div className="w-px h-8 bg-[#1A3A5C] shrink-0" />

          {/* Emojis */}
          <div className="flex-1 min-w-0">
            <p className="text-base leading-none tracking-widest">{dia.emojis}</p>
            <p className="text-[#5A8AAA] text-xs mt-1">{dia.acertos}/{dia.total} acertos</p>
          </div>

          {/* Pontos */}
          <div className="shrink-0 text-right">
            <p className="text-[#FFD23F] font-black text-base">{dia.pontos}</p>
            <p className="text-[#8AB4CC] text-xs">pts</p>
          </div>
        </div>
      ))}
    </div>
  )
}
