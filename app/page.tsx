'use client'

import { useState, useEffect, useCallback } from 'react'
import { Perfil } from '@/lib/types'
import { getJogadoresDoDia } from '@/lib/game'
import { carregarPerfil, getResultadoRodada } from '@/lib/perfil'
import { getContratosAtivos } from '@/lib/contrato'

import TelaPerfil, { StatsPerfil } from '@/components/TelaPerfil'
import JogoDesafio from '@/components/JogoDesafio'
import { TelaContratosAtivos } from '@/components/TelaContrato'
import TelaFinalDia from '@/components/TelaFinalDia'
import { Flame, FileText, Globe, Users } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregado, setCarregado] = useState(false)
  const [desafioIdx, setDesafioIdx] = useState(0)
  const [mostrarContratosAtivos, setMostrarContratosAtivos] = useState(false)
  const [mostrarFinalDia, setMostrarFinalDia] = useState(false)
  const [qtdContratosAtivos, setQtdContratosAtivos] = useState(0)

  const jogadoresDoDia = getJogadoresDoDia()

  useEffect(() => {
    const p = carregarPerfil()
    setPerfil(p)
    setQtdContratosAtivos(getContratosAtivos().length)
    setCarregado(true)
  }, [])

  const getStatusDesafio = useCallback((rodadaId: number): 'jogando' | 'ganhou' | 'perdeu' => {
    const resultado = getResultadoRodada(rodadaId)
    if (!resultado) return 'jogando'
    return resultado.pistaAcerto !== null ? 'ganhou' : 'perdeu'
  }, [perfil])

  if (!carregado) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 animate-pulse text-lg">⚽ Carregando...</div>
      </div>
    )
  }

  if (!perfil) {
    return <TelaPerfil onCriar={p => setPerfil(p)} />
  }

  const { rodadaId: rodadaAtiva, jogador: jogadorAtivo } = jogadoresDoDia[desafioIdx]

  // Verifica se ainda há desafio não jogado depois do atual
  const temProximoDesafio = jogadoresDoDia.slice(desafioIdx + 1).some(
    ({ rodadaId }) => getStatusDesafio(rodadaId) === 'jogando'
  )

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">⚽ ESCALA FC</h1>
            <p className="text-zinc-500 text-xs">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long', day: 'numeric', month: 'long',
              })} · 3 desafios hoje
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Contratos ativos */}
            {qtdContratosAtivos > 0 && (
              <button
                onClick={() => setMostrarContratosAtivos(true)}
                className="relative flex items-center gap-1 bg-yellow-950 border border-yellow-800 rounded-xl px-3 py-2"
              >
                <FileText size={15} className="text-yellow-400" />
                <span className="text-yellow-300 font-bold text-sm">{qtdContratosAtivos}</span>
              </button>
            )}
            {/* Streak */}
            <div className="flex items-center gap-1 bg-zinc-800 rounded-xl px-3 py-2">
              <Flame size={16} className="text-orange-400" />
              <span className="font-bold text-sm">{perfil.streakAtual}</span>
            </div>
          </div>
        </header>

        {/* Stats */}
        <StatsPerfil perfil={perfil} />

        {/* Seletor de desafio */}
        <div className="flex gap-2">
          {jogadoresDoDia.map(({ rodadaId }, i) => {
            const status = getStatusDesafio(rodadaId)
            const isAtivo = desafioIdx === i
            const emoji = status === 'ganhou' ? '✅' : status === 'perdeu' ? '❌' : '⚽'
            return (
              <button
                key={rodadaId}
                onClick={() => setDesafioIdx(i)}
                className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all flex flex-col items-center gap-1
                  ${isAtivo
                    ? 'bg-green-600 text-white shadow-lg shadow-green-900/40'
                    : status === 'ganhou'
                      ? 'bg-zinc-700 text-green-400 border border-green-800'
                      : status === 'perdeu'
                        ? 'bg-zinc-700 text-red-400 border border-red-900'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                  }`}
              >
                <span className="text-base leading-none">{emoji}</span>
                <span>Desafio {i + 1}</span>
              </button>
            )
          })}
        </div>

        {/* Jogo do desafio ativo */}
        <JogoDesafio
          key={rodadaAtiva}
          jogador={jogadorAtivo}
          rodadaId={rodadaAtiva}
          perfil={perfil}
          onResultado={p => setPerfil(p)}
          onContratosChange={setQtdContratosAtivos}
          onProximoDesafio={
            temProximoDesafio
              ? () => {
                  const proximo = jogadoresDoDia.findIndex(
                    ({ rodadaId }, i) => i > desafioIdx && getStatusDesafio(rodadaId) === 'jogando'
                  )
                  if (proximo !== -1) setDesafioIdx(proximo)
                }
              : undefined
          }
          onDiaCompleto={() => {
            // Garante que todos os 3 desafios estão realmente completos
            const todosConcluidos = jogadoresDoDia.every(
              ({ rodadaId }) => getStatusDesafio(rodadaId) !== 'jogando'
            )
            if (todosConcluidos) setMostrarFinalDia(true)
          }}
        />

        {/* Código de recuperação */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-center">
          <p className="text-zinc-500 text-xs">Código de recuperação:</p>
          <p className="text-zinc-300 font-mono font-bold text-sm mt-1">{perfil.codigo}</p>
          <p className="text-zinc-600 text-xs mt-1">Use em outro dispositivo para recuperar seu progresso</p>
        </div>

        {/* Navegação */}
        <nav className="flex gap-2">
          <Link
            href="/ranking"
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm font-semibold py-3 rounded-xl transition-all"
          >
            <Globe size={16} className="text-green-400" />
            Ranking Global
          </Link>
          <Link
            href="/grupos"
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm font-semibold py-3 rounded-xl transition-all"
          >
            <Users size={16} className="text-green-400" />
            Grupos
          </Link>
        </nav>

      </div>

      {/* Contratos ativos (modal) */}
      {mostrarContratosAtivos && (
        <TelaContratosAtivos onFechar={() => setMostrarContratosAtivos(false)} />
      )}

      {/* Tela final do dia */}
      {mostrarFinalDia && perfil && (
        <TelaFinalDia
          jogadoresDoDia={jogadoresDoDia}
          perfil={perfil}
          onFechar={() => setMostrarFinalDia(false)}
        />
      )}
    </main>
  )
}
