'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Perfil } from '@/lib/types'
import { carregarPerfil, getResultadoRodada } from '@/lib/perfil'
import { getJogadoresDoDia, getDiffDiasAtual } from '@/lib/game'
import { getModeAtual, getModeConfig } from '@/lib/gameMode'
import { getPosicaoRanking, getDiferencaPontosProximo, isSupabaseConfigurado } from '@/lib/supabase'
import HistoricoDias from '@/components/HistoricoDias'
import BottomNav from '@/components/BottomNav'
import { ArrowLeft, Flame, Trophy, Target, Zap, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function PerfilPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [posicaoGeral, setPosicaoGeral] = useState<number | null>(null)
  const [posicaoSemanal, setPosicaoSemanal] = useState<number | null>(null)
  const [diferencaProximo, setDiferencaProximo] = useState<number | null>(null)

  const mode = getModeAtual()
  const modeConfig = getModeConfig(mode)

  useEffect(() => {
    const p = carregarPerfil()
    if (!p) { router.replace('/'); return }
    setPerfil(p)

    if (isSupabaseConfigurado()) {
      const usuarioId = localStorage.getItem('escalafc_supabase_id')
      if (usuarioId) {
        getPosicaoRanking(usuarioId).then(pos => {
          if (pos.geral > 0) setPosicaoGeral(pos.geral)
          if (pos.semanal > 0) setPosicaoSemanal(pos.semanal)
        })
        getDiferencaPontosProximo(usuarioId).then(d => setDiferencaProximo(d))
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!perfil) return null

  // Pontos hoje
  const jogadoresDoDia = getJogadoresDoDia(mode)
  const pontosHoje = jogadoresDoDia.reduce((sum, { rodadaId }) => {
    const r = getResultadoRodada(rodadaId)
    return sum + (r?.pontos ?? 0)
  }, 0)
  const acertosHoje = jogadoresDoDia.filter(({ rodadaId }) => {
    const r = getResultadoRodada(rodadaId)
    return r?.pistaAcerto != null
  }).length

  const taxaAcerto = perfil.rodadasJogadas > 0
    ? Math.round((perfil.rodadasAcertadas / perfil.rodadasJogadas) * 100)
    : 0

  const diasJogados = getDiffDiasAtual(mode) + 1

  return (
    <main className="min-h-screen bg-[#0A1626] text-white">
      <div className="max-w-md mx-auto px-4 pt-5 pb-28 space-y-4">

        {/* Header */}
        <header className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-[#0F1D30] border border-[#1A3A5C] hover:border-[#00C853]/30 transition-all shrink-0">
            <ArrowLeft size={18} className="text-[#8AB4CC]" />
          </Link>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-black">👤 Meu Perfil</h1>
            <p className="text-[#8AB4CC] text-xs mt-0.5">{perfil.apelido}</p>
          </div>
          <div className="w-9 shrink-0" />
        </header>

        {/* Card de identidade */}
        <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-black text-xl">{perfil.apelido}</p>
              <p className="text-[#8AB4CC] text-xs mt-0.5">Jogando {modeConfig.name}</p>
            </div>
            <div className="text-right">
              {posicaoGeral && (
                <p className="text-[#FFD23F] font-black text-lg">#{posicaoGeral}</p>
              )}
              <p className="text-[#5A8AAA] text-xs">{posicaoGeral ? 'ranking geral' : '—'}</p>
            </div>
          </div>

          {/* Código de recuperação */}
          <div className="mt-3 pt-3 border-t border-[#1A3A5C] flex items-center justify-between">
            <p className="text-[#8AB4CC] text-xs">Código de recuperação</p>
            <p className="text-white font-mono font-bold text-sm">{perfil.codigo}</p>
          </div>
        </div>

        {/* Stats principais — grid 2×3 */}
        <div>
          <p className="text-[#8AB4CC] text-xs font-semibold uppercase tracking-wider px-1 mb-2">
            Estatísticas
          </p>
          <div className="grid grid-cols-2 gap-2">
            <StatCard emoji="🏆" valor={perfil.pontosTotal} label="Pontos total" cor="text-[#FFD23F]" />
            <StatCard emoji="⚡" valor={pontosHoje} label="Pontos hoje" cor="text-[#FFD23F]" />
            <StatCard emoji="🔥" valor={perfil.streakAtual} label="Sequência atual" cor="text-orange-400" />
            <StatCard emoji="💪" valor={perfil.streakMaximo} label="Melhor sequência" cor="text-orange-400" />
            <StatCard emoji="✅" valor={perfil.rodadasAcertadas} label="Total de acertos" cor="text-[#00C853]" />
            <StatCard emoji="📋" valor={perfil.rodadasJogadas} label="Rodadas jogadas" cor="text-[#8AB4CC]" />
          </div>
        </div>

        {/* Stats secundárias */}
        <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl px-4 py-4 space-y-3">
          <p className="text-white font-bold text-sm">Desempenho</p>

          <div className="space-y-2">
            {/* Taxa de acerto */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-[#8AB4CC]" />
                <p className="text-[#8AB4CC] text-sm">Taxa de acerto</p>
              </div>
              <p className="text-white font-bold text-sm">{taxaAcerto}%</p>
            </div>
            <div className="h-1.5 bg-[#1A3A5C] rounded-full overflow-hidden">
              <div className="h-full bg-[#00C853] rounded-full" style={{ width: `${taxaAcerto}%` }} />
            </div>

            {/* Hoje */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-[#8AB4CC]" />
                <p className="text-[#8AB4CC] text-sm">Hoje</p>
              </div>
              <p className="text-white font-bold text-sm">
                {acertosHoje}/{jogadoresDoDia.length} acertos · {pontosHoje} pts
              </p>
            </div>

            {/* Rankings */}
            {(posicaoGeral || posicaoSemanal) && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Trophy size={14} className="text-[#8AB4CC]" />
                  <p className="text-[#8AB4CC] text-sm">Rankings</p>
                </div>
                <p className="text-white font-bold text-sm">
                  {posicaoGeral ? `#${posicaoGeral} geral` : ''}
                  {posicaoGeral && posicaoSemanal ? ' · ' : ''}
                  {posicaoSemanal ? `#${posicaoSemanal} semana` : ''}
                </p>
              </div>
            )}

            {/* Diferença pro próximo */}
            {diferencaProximo !== null && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-orange-400" />
                  <p className="text-[#8AB4CC] text-sm">Para subir uma posição</p>
                </div>
                <p className="text-orange-400 font-bold text-sm">+{diferencaProximo} pts</p>
              </div>
            )}

            {/* Dias ativos */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-[#8AB4CC]" />
                <p className="text-[#8AB4CC] text-sm">Dias desde o início</p>
              </div>
              <p className="text-white font-bold text-sm">{diasJogados}</p>
            </div>
          </div>
        </div>

        {/* Histórico de dias */}
        <HistoricoDias mode={mode} includeToday maxDias={10} />

        {/* Ir para ranking */}
        <Link
          href="/ranking"
          className="flex items-center justify-between bg-[#0F1D30] border border-[#1A3A5C] hover:border-[#00C853]/30 rounded-2xl px-4 py-3 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🌍</span>
            <div>
              <p className="text-white font-bold text-sm">Ranking Global</p>
              <p className="text-[#8AB4CC] text-xs">Ver tabela completa</p>
            </div>
          </div>
          <ArrowLeft size={16} className="text-[#5A8AAA] rotate-180" />
        </Link>

      </div>
      <BottomNav />
    </main>
  )
}

function StatCard({ emoji, valor, label, cor }: { emoji: string; valor: number; label: string; cor: string }) {
  return (
    <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl px-3 py-3 flex items-center gap-2.5">
      <span className="text-xl shrink-0">{emoji}</span>
      <div>
        <p className={`font-black text-2xl leading-none ${cor}`}>{valor}</p>
        <p className="text-[#8AB4CC] text-xs mt-0.5 leading-tight">{label}</p>
      </div>
    </div>
  )
}
