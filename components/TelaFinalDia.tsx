'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Perfil, Jogador } from '@/lib/types'
import { getResultadoRodada } from '@/lib/perfil'
import { getContratosAtivos, calcularBonusMaximo } from '@/lib/contrato'
import { getPosicaoRanking, salvarTokenNotificacao } from '@/lib/supabase'
import { Flame, Trophy, Zap, Share2, X, ChevronRight, Medal, Bell } from 'lucide-react'
import {
  suportaNotificacoes, notificacoesAtivas,
  pedirPermissaoNotificacoes, statusPermissao,
} from '@/lib/notificacoes'

interface TelaFinalDiaProps {
  jogadoresDoDia: { rodadaId: number; jogador: Jogador }[]
  perfil: Perfil
  onFechar: () => void
}

export default function TelaFinalDia({ jogadoresDoDia, perfil, onFechar }: TelaFinalDiaProps) {
  const router = useRouter()
  const [posicaoRanking, setPosicaoRanking] = useState<number | null>(null)
  const [notifStatus, setNotifStatus] = useState<'idle' | 'pedindo' | 'ativo' | 'negado'>('idle')
  const notifAtivando = notifStatus === 'pedindo'

  useEffect(() => {
    if (!suportaNotificacoes()) return
    if (notificacoesAtivas()) setNotifStatus('ativo')
    else if (statusPermissao() === 'denied') setNotifStatus('negado')
  }, [])

  async function handleAtivarNotif() {
    setNotifStatus('pedindo')
    const token = await pedirPermissaoNotificacoes()
    if (token) {
      setNotifStatus('ativo')
      const usuarioId = typeof window !== 'undefined'
        ? (localStorage.getItem('escalafc_supabase_id') ?? undefined) : undefined
      void salvarTokenNotificacao({ token, usuarioId, apelido: perfil.apelido })
    } else {
      setNotifStatus(statusPermissao() === 'denied' ? 'negado' : 'idle')
    }
  }

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

  // Textos dinâmicos por desempenho — adaptado ao total de desafios (3 ou 5)
  const totalDesafios = jogadoresDoDia.length
  const pct = totalDesafios > 0 ? acertos / totalDesafios : 0
  const config = pct === 1
    ? { emoji: '🏆', titulo: 'Perfeito! Craque absoluto!', subtitulo: `Acertou os ${totalDesafios} desafios de hoje.`, cor: 'text-[#FFD23F]', bg: 'bg-[#0F1D30] border border-[#FFD23F]/30' }
    : pct >= 0.6
      ? { emoji: '🎯', titulo: 'Muito bem! Quase perfeito!', subtitulo: `${acertos} de ${totalDesafios} acertos. Amanhã vai de ${totalDesafios}!`, cor: 'text-[#00C853]', bg: 'bg-[#071A0F] border border-[#00C853]/30' }
      : pct >= 0.4
        ? { emoji: '⚽', titulo: `Boa! ${acertos} acerto${acertos !== 1 ? 's' : ''} hoje!`, subtitulo: 'Difícil, mas você jogou. Amanhã vai mais fundo!', cor: 'text-[#8AB4CC]', bg: 'bg-[#0F1D30] border border-[#2A5275]' }
        : { emoji: '💪', titulo: 'Hoje não foi — mas você jogou!', subtitulo: 'Amanhã são outros jogadores. Você sabe mais do que pensa.', cor: 'text-[#8AB4CC]', bg: 'bg-[#0F1D30] border border-[#1A3A5C]' }

  function gerarTextoCompartilhar() {
    const linhas = resultados.map(({ jogador, resultado }) => {
      const emojis = resultado?.tentativas.map(t =>
        t.status === 'acerto' ? '🟩' : '⬛'
      ).join('') ?? '—'
      return emojis
    }).join(' ')
    return `⚽ COBRA DA COPA — Quem é o Craque?\n${acertos}/${totalDesafios} acertos hoje!\n${linhas}\n\nFiz ${pontosHoje} pts. Você consegue mais?\nhttps://cobra-copa.vercel.app`
  }

  function compartilhar() {
    const texto = gerarTextoCompartilhar()
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  function desafiarAmigo() {
    const texto = `⚽ Fiz ${pontosHoje} pts hoje no COBRA DA COPA!\nConsegue me superar?\nhttps://cobra-copa.vercel.app`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-3">
      <div className="bg-[#0A1626] border border-[#1A3A5C] rounded-2xl w-full max-w-sm max-h-[95vh] overflow-y-auto">

        {/* Botão fechar */}
        <div className="flex justify-end p-4 pb-0">
          <button onClick={onFechar} className="text-[#8AB4CC] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pb-6 space-y-5">

          {/* ── HERO ─────────────────────────────────────── */}
          <div className={`rounded-2xl border p-5 text-center space-y-2 ${config.bg}`}>
            <p className="text-5xl">{config.emoji}</p>
            <p className={`text-xl font-black ${config.cor}`}>{config.titulo}</p>
            <p className="text-[#8AB4CC] text-sm">{config.subtitulo}</p>
          </div>

          {/* ── SALVAR NA TELA INICIAL — logo após celebração ── */}
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl p-4 space-y-3">
            <p className="text-white font-bold text-sm text-center">
              📲 Salve o jogo na tela inicial para jogar amanhã
            </p>
            <p className="text-[#8AB4CC] text-xs text-center leading-relaxed">
              É assim que vai ficar no seu celular — toque no ícone e o jogo abre na hora.
            </p>
            {/* Foto real da tela inicial */}
            <div className="rounded-xl overflow-hidden border border-[#2A5275]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/iphone-home.jpg"
                alt="COBRA na tela inicial do iPhone"
                className="w-full object-cover"
                style={{ maxHeight: '220px', objectPosition: 'center 60%' }}
              />
            </div>
            <a
              href="/guia-tela-inicial"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-[#0F1D30] border border-[#00C853]/40 hover:border-[#00C853] text-[#00C853] font-semibold py-3 rounded-xl text-sm transition-all active:scale-95"
            >
              📖 Como salvar na tela inicial →
            </a>
          </div>

          {/* ── NOTIFICAÇÃO — aparece só se ainda não ativou ── */}
          {(notifStatus === 'idle' || notifStatus === 'pedindo') && suportaNotificacoes() && (
            <div className="bg-[#0F1D30] border border-[#00C853]/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔔</span>
                <div>
                  <p className="text-white font-bold text-sm">Quer ser avisado amanhã?</p>
                  <p className="text-[#8AB4CC] text-xs mt-0.5 leading-relaxed">
                    Ative as notificações e a gente te avisa quando o novo desafio abrir. Não perca sua sequência.
                  </p>
                </div>
              </div>
              <button
                onClick={handleAtivarNotif}
                disabled={notifAtivando}
                className="w-full flex items-center justify-center gap-2 bg-[#00C853] hover:bg-[#00E060] text-[#0A1626] font-bold py-3 rounded-xl text-sm transition-all active:scale-95"
              >
                <Bell size={16} />
                {notifAtivando ? 'Ativando...' : 'Ativar notificações'}
              </button>
            </div>
          )}

          {notifStatus === 'ativo' && (
            <div className="bg-[#071A0F] border border-[#00C853]/30 rounded-xl px-4 py-3 flex items-center gap-2">
              <Bell size={14} className="text-[#00C853]" />
              <p className="text-[#4A9A6A] text-xs">Notificações ativas — te avisamos amanhã às 8h ✓</p>
            </div>
          )}

          {/* ── PLACAR DO DIA ────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-3 text-center">
              <Trophy size={16} className="text-[#FFD23F] mx-auto mb-1" />
              <p className="text-[#FFD23F] font-black text-2xl">{pontosHoje}</p>
              <p className="text-[#8AB4CC] text-xs">pts hoje</p>

            </div>
            <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-[#FFD23F]">{acertos}<span className="text-[#8AB4CC] text-base">/{totalDesafios}</span></p>
              <p className="text-[#8AB4CC] text-xs mt-1">acertos</p>
            </div>
            <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-3 text-center">
              <Flame size={16} className="text-orange-400 mx-auto mb-1" />
              <p className="text-[#FFD23F] font-black text-2xl">{perfil.streakAtual}</p>
              <p className="text-[#8AB4CC] text-xs">sequência</p>
            </div>
          </div>

          {/* ── RANKING GLOBAL ───────────────────────────── */}
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-4 flex items-center gap-3">
            <Medal size={22} className="text-[#FFD23F] shrink-0" />
            <div className="flex-1">
              <p className="text-[#8AB4CC] text-xs uppercase tracking-wider font-semibold">Ranking global</p>
              <p className="text-white font-bold text-sm mt-0.5">
                {posicaoRanking
                  ? `#${posicaoRanking} entre todos os jogadores`
                  : `${perfil.pontosTotal} pts no total`
                }
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[#8AB4CC] text-xs">total</p>
              <p className="text-[#FFD23F] font-black text-lg">{perfil.pontosTotal}</p>
            </div>
          </div>

          {/* ── DESAFIOS DO DIA ──────────────────────────── */}
          <div className="space-y-2">
            <p className="text-[#8AB4CC] text-xs font-semibold uppercase tracking-wider">Seus desafios hoje</p>
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
                    ganhou ? 'bg-[#071A0F] border-[#00C853]/30' : 'bg-[#0F1D30] border-[#1A3A5C]'
                  }`}
                >
                  <span className="text-xl shrink-0">{jogador.bandeira}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate">{jogador.nome}</p>
                    <p className="text-[#8AB4CC] text-xs">{emojis || '—'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {ganhou ? (
                      <>
                        <p className="text-[#FFD23F] font-black text-sm">+{pontos}</p>
                        <p className="text-[#8AB4CC] text-xs">{resultado?.pistaAcerto === 0 ? 'histórico' : `pista ${resultado?.pistaAcerto}`}</p>
                      </>
                    ) : (
                      <p className="text-[#5A8AAA] text-xs">0 pts</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── CONTRATOS ATIVOS ─────────────────────────── */}
          {contratosHoje.length > 0 && (
            <div className="bg-[#1A0F00] border border-[#FFD23F]/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-[#FFD23F]" />
                <p className="text-[#FFD23F] font-bold text-sm">Contratos ativos hoje</p>
              </div>
              <p className="text-[#8AB4CC] text-xs">
                Você fechou contrato com {contratosHoje.length === 1 ? 'um jogador' : `${contratosHoje.length} jogadores`}.
                O bônus é calculado automaticamente após as partidas.
              </p>
              {contratosHoje.map(c => (
                <div key={c.id} className="flex items-center gap-2">
                  <span className="text-base">{c.bandeira}</span>
                  <div className="flex-1">
                    <p className="text-white text-xs font-bold">{c.nomeJogador}</p>
                    <p className="text-[#8AB4CC] text-xs">{c.multiplicador}× multiplicador</p>
                  </div>
                  <p className="text-[#FFD23F] font-bold text-sm">até +{calcularBonusMaximo(c.multiplicador)} pts</p>
                </div>
              ))}
              <div className="border-t border-[#FFD23F]/30 pt-2 flex justify-between items-center">
                <p className="text-[#FFD23F] text-xs">Bônus potencial total</p>
                <p className="text-[#FFD23F] font-black text-lg">+{bonusPotencialTotal} pts</p>
              </div>
            </div>
          )}

          {/* ── CTAs ─────────────────────────────────────── */}
          <div className="space-y-2">
            <button
              onClick={compartilhar}
              className="w-full flex items-center justify-center gap-2 bg-[#00C853] hover:bg-[#00E060] text-[#0A1626] font-bold rounded-xl py-4 text-sm transition-colors"
            >
              <Share2 size={16} />
              Compartilhar resultado no WhatsApp
            </button>
            <button
              onClick={desafiarAmigo}
              className="w-full flex items-center justify-center gap-2 bg-[#0F1D30] border border-[#FFD23F]/40 hover:border-[#FFD23F]/70 text-[#FFD23F] font-semibold rounded-xl py-3 text-sm transition-all"
            >
              ⚔️ Desafiar um amigo
              <ChevronRight size={14} className="text-[#8AB4CC]" />
            </button>
          </div>

          {/* ── MOTIVAÇÃO PRO DIA SEGUINTE ───────────────── */}
          <div className="text-center space-y-1 py-1">
            <p className="text-white font-bold">🔔 Novos desafios amanhã!</p>
            <p className="text-[#8AB4CC] text-xs">
              {perfil.streakAtual > 1
                ? `Você está em ${perfil.streakAtual} dias seguidos. Não deixe apagar!`
                : 'Volte amanhã e comece sua sequência de acertos.'}
            </p>
            <p className="text-[#5A8AAA] text-xs pt-1">
              Pontuação total: <span className="text-[#8AB4CC] font-semibold">{perfil.pontosTotal} pts</span>
              {posicaoRanking ? ` · #${posicaoRanking} no ranking` : ''}
            </p>
          </div>

          {/* ── VER RANKING ─────────────────────────────── */}
          <button
            onClick={() => { onFechar(); router.push('/ranking') }}
            className="w-full text-center text-[#8AB4CC] hover:text-white text-sm font-semibold py-2 border border-[#1A3A5C] rounded-xl transition-colors"
          >
            🏆 Ver meu ranking
          </button>

        </div>
      </div>
    </div>
  )
}
