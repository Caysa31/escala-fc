'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Perfil, Jogador } from '@/lib/types'
import jogadoresData from '@/data/jogadores.json'
import { carregarPerfil, getResultadoRodada, carregarResultados } from '@/lib/perfil'
import { getContratosAtivos } from '@/lib/contrato'

import TelaPerfil, { StatsPerfil } from '@/components/TelaPerfil'
import JogoDesafio from '@/components/JogoDesafio'
import { TelaContratosAtivos } from '@/components/TelaContrato'
import TelaFinalDia from '@/components/TelaFinalDia'
import { Flame, FileText, FlaskConical } from 'lucide-react'

const jogadores = jogadoresData as Jogador[]

/** Retorna 3 jogadores baseados no seed — distribuição uniforme pelo array */
function getJogadoresPorSeed(seed: number): Array<{ jogador: Jogador; rodadaId: number }> {
  const total = jogadores.length
  return [0, 1, 2].map(i => {
    const indice = Math.abs((seed * 37 + i * 11)) % total
    const jogador = jogadores[indice]
    const rodadaId = -(seed * 100 + i + 1)   // IDs negativos — nunca conflitam com os reais
    return { jogador, rodadaId }
  })
}

/** Apaga só os resultados das rodadas de teste (por ID) do localStorage */
function limparResultadosTeste(rodadaIds: number[]) {
  if (typeof window === 'undefined') return
  try {
    const resultados = carregarResultados()
    const filtrados = resultados.filter(r => !rodadaIds.includes(r.rodadaId))
    localStorage.setItem('escalafc_resultados', JSON.stringify(filtrados))
  } catch { /* silencioso */ }
}

export default function TestePage() {
  const params = useParams()
  const seed = parseInt(params.seed as string, 10) || 1

  const jogadoresDoDia = getJogadoresPorSeed(seed)

  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregado, setCarregado] = useState(false)
  const [desafioIdx, setDesafioIdx] = useState(0)
  const [mostrarContratosAtivos, setMostrarContratosAtivos] = useState(false)
  const [mostrarFinalDia, setMostrarFinalDia] = useState(false)
  const [qtdContratosAtivos, setQtdContratosAtivos] = useState(0)

  const finalDiaMostrado = useRef(false)

  // Ao montar (ou trocar de seed), limpa os resultados de teste e carrega o perfil
  useEffect(() => {
    const idsDoTeste = jogadoresDoDia.map(j => j.rodadaId)
    limparResultadosTeste(idsDoTeste)

    const p = carregarPerfil()
    setPerfil(p)
    setQtdContratosAtivos(getContratosAtivos().length)
    setCarregado(true)
    setDesafioIdx(0)
    setMostrarFinalDia(false)
    finalDiaMostrado.current = false
    setMostrarContratosAtivos(false)
  }, [seed]) // eslint-disable-line react-hooks/exhaustive-deps

  // Detecta quando todos os 3 desafios de teste estão completos
  useEffect(() => {
    if (!carregado || finalDiaMostrado.current) return

    const todosConcluidos = jogadoresDoDia.every(
      ({ rodadaId }) => getResultadoRodada(rodadaId) !== null
    )

    if (todosConcluidos) {
      finalDiaMostrado.current = true
      const timer = setTimeout(() => setMostrarFinalDia(true), 600)
      return () => clearTimeout(timer)
    }
  }, [perfil, carregado]) // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusDesafio = useCallback((rodadaId: number): 'jogando' | 'ganhou' | 'perdeu' => {
    const resultado = getResultadoRodada(rodadaId)
    if (!resultado) return 'jogando'
    return resultado.pistaAcerto !== null ? 'ganhou' : 'perdeu'
  }, [perfil])

  if (!carregado) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 animate-pulse text-lg">⚽ Carregando teste...</div>
      </div>
    )
  }

  if (!perfil) {
    return <TelaPerfil onCriar={p => setPerfil(p)} />
  }

  const { rodadaId: rodadaAtiva, jogador: jogadorAtivo } = jogadoresDoDia[desafioIdx]

  const temProximoDesafio = jogadoresDoDia.slice(desafioIdx + 1).some(
    ({ rodadaId }) => getStatusDesafio(rodadaId) === 'jogando'
  )

  const desafioAnterior = desafioIdx > 0 ? jogadoresDoDia[desafioIdx - 1] : null
  const mensagemMotivacional = desafioAnterior && getStatusDesafio(desafioAnterior.rodadaId) === 'perdeu'
    ? '💪 Essa não foi — mas o jogo não acabou! Ainda dá pra marcar pontos.'
    : undefined

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">

        {/* Banner modo teste */}
        <div className="bg-purple-950 border border-purple-800 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <FlaskConical size={15} className="text-purple-400 shrink-0" />
          <div className="flex-1">
            <p className="text-purple-300 text-xs font-bold">MODO TESTE — Seed #{seed}</p>
            <p className="text-purple-500 text-xs">Pontos não contam para o ranking. Resultados resetam ao reabrir.</p>
          </div>
          <a
            href={`/teste/${seed + 1}`}
            className="text-purple-400 text-xs font-semibold underline shrink-0"
          >
            Seed {seed + 1} →
          </a>
        </div>

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">⚽ ESCALA FC</h1>
            <p className="text-zinc-500 text-xs">
              Teste de jogo completo · 3 desafios
            </p>
          </div>
          <div className="flex items-center gap-2">
            {qtdContratosAtivos > 0 && (
              <button
                onClick={() => setMostrarContratosAtivos(true)}
                className="relative flex items-center gap-1 bg-yellow-950 border border-yellow-800 rounded-xl px-3 py-2"
              >
                <FileText size={15} className="text-yellow-400" />
                <span className="text-yellow-300 font-bold text-sm">{qtdContratosAtivos}</span>
              </button>
            )}
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

        {/* Jogo */}
        <JogoDesafio
          key={`${seed}-${rodadaAtiva}`}
          jogador={jogadorAtivo}
          rodadaId={rodadaAtiva}
          perfil={perfil}
          indiceDesafio={desafioIdx}
          mensagemMotivacional={mensagemMotivacional}
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
        />

        {/* Links de outros seeds */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3">
          <p className="text-zinc-500 text-xs text-center mb-2">Outros seeds para testar:</p>
          <div className="flex gap-1 flex-wrap justify-center">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <a
                key={s}
                href={`/teste/${s}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  s === seed
                    ? 'bg-purple-700 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                #{s}
              </a>
            ))}
          </div>
        </div>

      </div>

      {/* Contratos ativos */}
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
