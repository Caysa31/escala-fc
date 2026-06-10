'use client'

import { useState, useEffect } from 'react'
import { Perfil } from '@/lib/types'
import { criarPerfil, recuperarPerfilPorApelido, getResultadoRodada } from '@/lib/perfil'
import { getModeAtual, getModeConfig } from '@/lib/gameMode'
import { getJogadoresDoDia } from '@/lib/game'
import { getPosicaoRanking, getDiferencaPontosProximo, verificarApelidoDisponivel } from '@/lib/supabase'
import { Flame, Trophy, Medal, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface TelaPerfilProps {
  onCriar: (perfil: Perfil) => void
}

export default function TelaPerfil({ onCriar }: TelaPerfilProps) {
  const [apelido, setApelido] = useState('')
  const [erro, setErro] = useState('')
  const [verificando, setVerificando] = useState(false)
  const [sugestoes, setSugestoes] = useState<string[]>([])

  // Fluxo de recuperação
  const [modoRecuperacao, setModoRecuperacao] = useState(false)
  const [apelidoRecuperacao, setApelidoRecuperacao] = useState('')
  const [erroRecuperacao, setErroRecuperacao] = useState('')
  const [recuperando, setRecuperando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nome = apelido.trim()
    if (!nome) { setErro('Digite um apelido para continuar'); return }
    if (nome.length < 2) { setErro('Apelido muito curto (mínimo 2 caracteres)'); return }

    setVerificando(true)
    setSugestoes([])
    try {
      const disponivel = await verificarApelidoDisponivel(nome)
      if (!disponivel) {
        setSugestoes([`${nome}2`, `${nome}FC`, `${nome}10`])
        setErro('Esse apelido já está em uso — escolha outro ou use uma sugestão abaixo')
        return
      }
    } finally {
      setVerificando(false)
    }

    onCriar(criarPerfil(nome))
  }

  async function handleRecuperar(e: React.FormEvent) {
    e.preventDefault()
    const apelido = apelidoRecuperacao.trim()
    if (!apelido) { setErroRecuperacao('Digite seu apelido'); return }

    setRecuperando(true)
    setErroRecuperacao('')
    try {
      const perfil = await recuperarPerfilPorApelido(apelido)
      if (!perfil) {
        setErroRecuperacao('Apelido não encontrado. Verifique como digitou.')
        return
      }
      onCriar(perfil)
    } finally {
      setRecuperando(false)
    }
  }

  const modeConfig = getModeConfig(getModeAtual())

  return (
    <div className="min-h-screen bg-[#0A1626] flex flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm space-y-5">

        {/* Logo */}
        <div className="text-center space-y-1.5">
          <p className="text-5xl leading-none">{modeConfig.emoji}</p>
          <h1 className="text-4xl font-black text-white tracking-widest leading-tight">{modeConfig.name}</h1>
          <p className="text-sm font-bold tracking-wider" style={{ color: modeConfig.subtitleColor }}>{modeConfig.tagline}</p>
          <p className="text-[#8AB4CC] text-sm">
            {modeConfig.description}
          </p>
        </div>

        {/* Como funciona — compacto */}
        <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl px-5 py-4 space-y-2">
          <p className="text-white font-bold text-xs uppercase tracking-wider mb-3">Como funciona</p>
          <div className="space-y-1.5 text-sm text-[#8AB4CC]">
            <p>🔒 Pistas reveladas uma por vez</p>
            <p>⬇️ Quanto menos pistas, mais pontos</p>
            <p>🔥 Jogue todo dia para manter sua sequência</p>
          </div>
        </div>

        {/* Dois diferenciais */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl p-4 space-y-1.5">
            <p className="text-xl">🌍</p>
            <p className="text-white font-bold text-sm">Ranking Global</p>
            <p className="text-[#8AB4CC] text-xs leading-snug">
              Compita com jogadores do Brasil inteiro. Quem é o cobra de verdade?
            </p>
          </div>
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl p-4 space-y-1.5">
            <p className="text-xl">⚡</p>
            <p className="text-white font-bold text-sm">Bônus de Contrato</p>
            <p className="text-[#8AB4CC] text-xs leading-snug">
              Acertou? O que ele fizer em campo rende pontos pra você.
            </p>
          </div>
        </div>

        {/* ── Novo jogador ── */}
        {!modoRecuperacao && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[#8AB4CC] text-sm mb-2">Escolha seu apelido:</label>
              <input
                type="text"
                value={apelido}
                onChange={e => { setApelido(e.target.value); setErro(''); setSugestoes([]) }}
                placeholder="Ex: CraqueDaSala"
                maxLength={20}
                className="w-full bg-[#0F1D30] border-2 border-[#1A3A5C] focus:border-[#00C853] rounded-xl px-4 py-3 text-white placeholder-[#2A4A6A] outline-none transition-colors text-base"
                autoFocus
              />
              {erro && <p className="text-red-400 text-xs mt-1">{erro}</p>}
              {sugestoes.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {sugestoes.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setApelido(s); setErro(''); setSugestoes([]) }}
                      className="bg-[#1A3A5C] hover:bg-[#1A3A5C] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={verificando}
              className={`w-full font-black text-lg rounded-xl py-4 transition-colors ${
                verificando ? 'bg-[#1A3A5C] text-[#8AB4CC] cursor-not-allowed' : 'bg-[#00C853] hover:bg-[#00E060] text-[#0A1626]'
              }`}
            >
              {verificando ? 'Verificando...' : 'ENTRAR NO JOGO'}
            </button>

            {/* Toggle para recuperação */}
            <button
              type="button"
              onClick={() => { setModoRecuperacao(true); setErro('') }}
              className="w-full text-[#8AB4CC] hover:text-white text-sm font-semibold text-center py-2 underline underline-offset-4 decoration-[#2A4A6A] hover:decoration-[#8AB4CC] transition-colors"
            >
              Já joguei antes →
            </button>
          </form>
        )}

        {/* ── Recuperar conta ── */}
        {modoRecuperacao && (
          <form onSubmit={handleRecuperar} className="space-y-3">
            <div>
              <label className="block text-[#8AB4CC] text-sm mb-1">Qual era o seu apelido?</label>
              <p className="text-[#5A8AAA] text-xs mb-2">
                O mesmo apelido que você escolheu quando entrou no jogo.
              </p>
              <input
                type="text"
                value={apelidoRecuperacao}
                onChange={e => { setApelidoRecuperacao(e.target.value); setErroRecuperacao('') }}
                placeholder="Ex: CraqueDaSala"
                maxLength={20}
                className="w-full bg-[#0F1D30] border-2 border-[#1A3A5C] focus:border-[#00C853] rounded-xl px-4 py-3 text-white placeholder-[#2A4A6A] outline-none transition-colors text-base"
                autoFocus
              />
              {erroRecuperacao && <p className="text-red-400 text-xs mt-1">{erroRecuperacao}</p>}
            </div>
            <button
              type="submit"
              disabled={recuperando}
              className={`w-full font-black text-lg rounded-xl py-4 transition-colors ${
                recuperando ? 'bg-[#1A3A5C] text-[#8AB4CC] cursor-not-allowed' : 'bg-[#0F1D30] border border-[#1A3A5C] hover:border-[#00C853] text-white'
              }`}
            >
              {recuperando ? 'Buscando conta...' : 'RECUPERAR CONTA'}
            </button>

            <button
              type="button"
              onClick={() => { setModoRecuperacao(false); setErroRecuperacao('') }}
              className="w-full text-[#8AB4CC] hover:text-white text-sm text-center py-2 transition-colors"
            >
              ← Criar novo apelido
            </button>
          </form>
        )}

        <p className="text-center text-[#5A8AAA] text-xs">
          Sem cadastro. Sem e-mail. Sem senha.
          <br />
          Seu progresso é salvo automaticamente.
        </p>
      </div>
    </div>
  )
}

// --- Componente de stats do perfil (usado no header do jogo) ---

interface StatsPerfilProps {
  perfil: Perfil
}

export function StatsPerfil({ perfil }: StatsPerfilProps) {
  const [posicaoRanking, setPosicaoRanking] = useState<number | null>(null)
  const [diferencaProximo, setDiferencaProximo] = useState<number | null>(null)

  // Pontos ganhos hoje (soma dos desafios do dia)
  const jogadoresDoDia = getJogadoresDoDia()
  const pontosHoje = jogadoresDoDia.reduce((sum, { rodadaId }) => {
    const resultado = getResultadoRodada(rodadaId)
    return sum + (resultado?.pontos ?? 0)
  }, 0)

  // Taxa de acerto
  const taxaAcerto = perfil.rodadasJogadas > 0
    ? Math.round((perfil.rodadasAcertadas / perfil.rodadasJogadas) * 100)
    : 0

  // Posição no ranking global + diferença pro próximo
  useEffect(() => {
    const usuarioId = typeof window !== 'undefined'
      ? localStorage.getItem('escalafc_supabase_id')
      : null
    if (!usuarioId) return
    getPosicaoRanking(usuarioId).then(pos => {
      if (pos.geral > 0) setPosicaoRanking(pos.geral)
    })
    getDiferencaPontosProximo(usuarioId).then(d => setDiferencaProximo(d))
  }, [perfil.pontosTotal])

  return (
    <Link href="/perfil" className="block">
      <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl px-3 py-3 space-y-2 active:opacity-80 transition-opacity">
        {/* Nome + ranking */}
        <div className="flex items-center justify-between">
          <p className="text-white font-bold text-sm">Olá, {perfil.apelido} 👋</p>
          <div className="flex items-center gap-2">
            {posicaoRanking && (
              <p className="text-[#FFD23F] text-xs font-bold">🏅 #{posicaoRanking}</p>
            )}
            <ChevronRight size={14} className="text-[#5A8AAA]" />
          </div>
        </div>

        {/* 4 stats compactos */}
        <div className="grid grid-cols-4 gap-1">
          {[
            { icon: '🏆', val: perfil.pontosTotal, label: 'pts total' },
            { icon: '⚡', val: pontosHoje,         label: 'pts hoje' },
            { icon: '🔥', val: perfil.streakAtual, label: 'sequência' },
            { icon: '🥇', val: posicaoRanking ? `#${posicaoRanking}` : '—', label: 'ranking' },
          ].map(({ icon, val, label }) => (
            <div key={label} className="bg-[#0A1626] rounded-lg px-1 py-1.5 text-center">
              <p className="text-sm leading-none">{icon}</p>
              <p className="text-[#FFD23F] font-black text-base leading-tight mt-0.5">{val}</p>
              <p className="text-[#8AB4CC] text-[9px] mt-0.5 leading-none">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </Link>
  )
}

