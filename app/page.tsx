'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Perfil } from '@/lib/types'
import { getJogadoresDoDia } from '@/lib/game'
import { carregarPerfil, getResultadoRodada, sincronizarPontosDeServidor } from '@/lib/perfil'
import { getContratosAtivos } from '@/lib/contrato'
import { getMultiplicadorTreino } from '@/lib/modos'

import TelaPerfil, { StatsPerfil } from '@/components/TelaPerfil'
import JogoDesafio from '@/components/JogoDesafio'
import { TelaContratosAtivos } from '@/components/TelaContrato'
import TelaFinalDia from '@/components/TelaFinalDia'
import BotaoNotificacoes from '@/components/BotaoNotificacoes'
import { Flame, FileText } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A1626] flex flex-col items-center justify-center gap-3">
        <div className="text-4xl animate-bounce">🐍</div>
        <div className="text-[#FFD23F] font-black text-xl tracking-widest">COBRA DA COPA</div>
        <div className="text-[#1A3A5C] text-xs animate-pulse">carregando...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}

function HomeContent() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregado, setCarregado] = useState(false)
  const [desafioIdx, setDesafioIdx] = useState(0)
  const [mostrarContratosAtivos, setMostrarContratosAtivos] = useState(false)
  const [mostrarFinalDia, setMostrarFinalDia] = useState(false)
  const [qtdContratosAtivos, setQtdContratosAtivos] = useState(0)

  const finalDiaMostrado = useRef(false)
  const isInitialLoad = useRef(true)

  // ?preview=N permite testar dias diferentes (ex: ?preview=5 → dia 5)
  const searchParams = useSearchParams()
  const previewDia = searchParams.get('preview') ? Number(searchParams.get('preview')) : undefined

  const jogadoresDoDia = getJogadoresDoDia(previewDia)

  useEffect(() => {
    const p = carregarPerfil()
    setPerfil(p)
    setQtdContratosAtivos(getContratosAtivos().length)
    setCarregado(true)
    void sincronizarPontosDeServidor().then(() => {
      const pAtualizado = carregarPerfil()
      if (pAtualizado) setPerfil(pAtualizado)
    })
  }, [])

  useEffect(() => {
    if (!carregado || finalDiaMostrado.current) return
    if (isInitialLoad.current) { isInitialLoad.current = false; return }
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
      <div className="min-h-screen bg-[#0A1626] flex flex-col items-center justify-center gap-3">
        <div className="text-4xl animate-bounce">🐍</div>
        <div className="text-[#FFD23F] font-black text-xl tracking-widest">COBRA DA COPA</div>
        <div className="text-[#1A3A5C] text-xs animate-pulse">carregando...</div>
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

  const totalDesafiosConcluidos = jogadoresDoDia.filter(
    ({ rodadaId }) => getStatusDesafio(rodadaId) !== 'jogando'
  ).length

  return (
    <main className="min-h-screen bg-[#0A1626] text-white">

      {/* ── CONTEÚDO PRINCIPAL ─────────────────────────────── */}
      <div className="max-w-md mx-auto px-4 pt-3 pb-28 space-y-3">

        {/* ── HEADER ───────────────────────────────────────── */}
        <header className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐍</span>
            <div>
              <h1 className="text-2xl font-black tracking-widest text-white leading-none">COBRA DA COPA</h1>
              <p className="text-xs text-[#FFD23F] font-semibold tracking-wider leading-none mt-0.5">
                QUEM É O CRAQUE? <span className="text-[10px]">⚽</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {qtdContratosAtivos > 0 && (
              <button onClick={() => setMostrarContratosAtivos(true)}
                className="flex items-center gap-1.5 bg-[#0F1D30] border border-[#1A3A5C] rounded-xl px-3 py-2">
                <FileText size={14} className="text-[#FFD23F]" />
                <span className="text-[#FFD23F] font-bold text-sm">{qtdContratosAtivos}</span>
              </button>
            )}
            {getMultiplicadorTreino() > 1 && (
              <div className="flex items-center gap-1 bg-[#0F1D30] border border-[#1A3A5C] rounded-xl px-3 py-2">
                <span className="text-orange-400 font-black text-sm">×{getMultiplicadorTreino()}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-[#2A1A00] border border-[#FFD23F]/30 rounded-xl px-3 py-2">
              <Flame size={15} className="text-[#FFD23F]" />
              <span className="font-black text-sm text-[#FFD23F]">{perfil.streakAtual}</span>
            </div>
          </div>
        </header>

        {/* ── STATS ────────────────────────────────────────── */}
        <StatsPerfil perfil={perfil} />

        {/* ── DESAFIOS DO DIA ──────────────────────────────── */}
        <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-white font-bold text-sm">Desafios de hoje</p>
            <p className="text-[#8AB4CC] text-xs">{totalDesafiosConcluidos}/5 concluídos</p>
          </div>

          <div className="flex gap-2">
            {jogadoresDoDia.map(({ rodadaId }, i) => {
              const status = getStatusDesafio(rodadaId)
              const isAtivo = desafioIdx === i
              return (
                <button
                  key={rodadaId}
                  onClick={() => setDesafioIdx(i)}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all flex flex-col items-center gap-1
                    ${isAtivo
                      ? 'bg-[#00C853] text-[#0A1626]'
                      : status === 'ganhou'
                        ? 'bg-[#0F1D30] text-[#00C853] border border-[#00C853]/40'
                        : status === 'perdeu'
                          ? 'bg-[#0F1D30] text-red-400 border border-red-900/30'
                          : 'bg-[#1A3050] text-[#8AB4CC] border border-[#1A3A5C]'
                    }`}
                >
                  <span className="text-lg leading-none">
                    {status === 'ganhou' ? '✅' : status === 'perdeu' ? '❌' : '⚽'}
                  </span>
                  <span className="text-xs">Desafio {i + 1}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── NOTIFICAÇÕES ─────────────────────────────────── */}
        <BotaoNotificacoes apelido={perfil.apelido} />

        {/* ── JOGO ─────────────────────────────────────────── */}
        <JogoDesafio
          key={rodadaAtiva}
          jogador={jogadorAtivo}
          rodadaId={rodadaAtiva}
          perfil={perfil}
          indiceDesafio={desafioIdx}
          mensagemMotivacional={mensagemMotivacional}
          telaFinalAberta={mostrarFinalDia}
          temBottomNav={true}
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

        {/* ── CÓDIGO DE RECUPERAÇÃO ────────────────────────── */}
        <div className="bg-[#0A1020] border border-[#1A3A5C]/50 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[#8AB4CC] text-[10px] font-semibold uppercase tracking-wider">Código de recuperação</p>
            <p className="text-white font-mono font-bold text-sm mt-0.5">{perfil.codigo}</p>
          </div>
          <p className="text-[#1A3A5C] text-[10px] text-right max-w-[100px] leading-tight">
            Use em outro dispositivo
          </p>
        </div>

      </div>

      {/* ── BOTTOM NAVIGATION ────────────────────────────────── */}
      <BottomNav />

      {/* ── MODAIS ───────────────────────────────────────────── */}
      {mostrarContratosAtivos && (
        <TelaContratosAtivos onFechar={() => setMostrarContratosAtivos(false)} />
      )}
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
