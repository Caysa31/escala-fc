'use client'

import { useState, useEffect } from 'react'
import { Perfil } from '@/lib/types'
import { criarPerfil, recuperarPerfilPorApelido, getResultadoRodada } from '@/lib/perfil'
import { getJogadoresDoDia } from '@/lib/game'
import { getPosicaoRanking, verificarApelidoDisponivel } from '@/lib/supabase'
import { Flame, Trophy, Medal } from 'lucide-react'

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

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="text-center">
          <h1 className="text-5xl font-black text-white tracking-tight">⚽ ESCALA FC</h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Adivinhe o jogador do dia com o mínimo de pistas
          </p>
        </div>

        {/* Como funciona */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-3">
          <p className="text-white font-bold text-sm">Como funciona:</p>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>🔒 Pistas reveladas uma por vez</p>
            <p>⬇️ Quanto menos pistas, mais pontos</p>
            <p>🟩 Compartilhe sem spoiler</p>
            <p>🔥 Jogue todo dia para manter sua sequência</p>
          </div>
        </div>

        {/* ── Novo jogador ── */}
        {!modoRecuperacao && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Escolha seu apelido:</label>
              <input
                type="text"
                value={apelido}
                onChange={e => { setApelido(e.target.value); setErro(''); setSugestoes([]) }}
                placeholder="Ex: CraqueDaSala"
                maxLength={20}
                className="w-full bg-zinc-800 border-2 border-zinc-600 focus:border-green-400 rounded-xl px-4 py-3 text-white placeholder-zinc-500 outline-none transition-colors text-base"
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
                      className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
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
                verificando ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-400 text-black'
              }`}
            >
              {verificando ? 'Verificando...' : 'ENTRAR NO JOGO'}
            </button>

            {/* Toggle para recuperação */}
            <button
              type="button"
              onClick={() => { setModoRecuperacao(true); setErro('') }}
              className="w-full text-zinc-400 hover:text-white text-sm font-semibold text-center py-2 underline underline-offset-4 decoration-zinc-600 hover:decoration-zinc-400 transition-colors"
            >
              Já joguei antes →
            </button>
          </form>
        )}

        {/* ── Recuperar conta ── */}
        {modoRecuperacao && (
          <form onSubmit={handleRecuperar} className="space-y-3">
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Qual era o seu apelido?</label>
              <p className="text-zinc-600 text-xs mb-2">
                O mesmo apelido que você escolheu quando entrou no jogo.
              </p>
              <input
                type="text"
                value={apelidoRecuperacao}
                onChange={e => { setApelidoRecuperacao(e.target.value); setErroRecuperacao('') }}
                placeholder="Ex: CraqueDaSala"
                maxLength={20}
                className="w-full bg-zinc-800 border-2 border-zinc-600 focus:border-blue-400 rounded-xl px-4 py-3 text-white placeholder-zinc-500 outline-none transition-colors text-base"
                autoFocus
              />
              {erroRecuperacao && <p className="text-red-400 text-xs mt-1">{erroRecuperacao}</p>}
            </div>
            <button
              type="submit"
              disabled={recuperando}
              className={`w-full font-black text-lg rounded-xl py-4 transition-colors ${
                recuperando ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {recuperando ? 'Buscando conta...' : 'RECUPERAR CONTA'}
            </button>

            <button
              type="button"
              onClick={() => { setModoRecuperacao(false); setErroRecuperacao('') }}
              className="w-full text-zinc-500 hover:text-zinc-300 text-sm text-center py-2 transition-colors"
            >
              ← Criar novo apelido
            </button>
          </form>
        )}

        <p className="text-center text-zinc-600 text-xs">
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

  // Pontos ganhos hoje (soma dos desafios do dia)
  const jogadoresDoDia = getJogadoresDoDia()
  const pontosHoje = jogadoresDoDia.reduce((sum, { rodadaId }) => {
    const resultado = getResultadoRodada(rodadaId)
    return sum + (resultado?.pontos ?? 0)
  }, 0)

  // Posição no ranking global (busca async)
  useEffect(() => {
    const usuarioId = typeof window !== 'undefined'
      ? localStorage.getItem('escalafc_supabase_id')
      : null
    if (usuarioId) {
      getPosicaoRanking(usuarioId).then(pos => {
        if (pos.geral > 0) setPosicaoRanking(pos.geral)
      })
    }
  }, [perfil.pontosTotal])

  return (
    <div className="grid grid-cols-4 gap-2">
      <StatCard icon={<Flame size={16} className="text-orange-400" />} valor={perfil.streakAtual} label="Sequência" />
      <StatCard icon={<Trophy size={16} className="text-yellow-400" />} valor={pontosHoje} label="Hoje" />
      <StatCard icon={<Medal size={16} className="text-yellow-400" />} valor={posicaoRanking ? `#${posicaoRanking}` : '—'} label="Ranking" />
      <StatCard icon={<Trophy size={16} className="text-green-400" />} valor={perfil.pontosTotal} label="Total" />
    </div>
  )
}

function StatCard({ icon, valor, label }: { icon: React.ReactNode; valor: number | string; label: string }) {
  return (
    <div className="bg-zinc-800 rounded-xl p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-white font-bold text-lg leading-none">{valor}</p>
      <p className="text-zinc-500 text-xs mt-1">{label}</p>
    </div>
  )
}
