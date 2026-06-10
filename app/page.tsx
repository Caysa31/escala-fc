'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Perfil } from '@/lib/types'
import { getJogadoresDoDia } from '@/lib/game'
import { carregarPerfil, getResultadoRodada, sincronizarPontosDeServidor } from '@/lib/perfil'
import { getContratosAtivos } from '@/lib/contrato'
import { getMultiplicadorTreino } from '@/lib/modos'
import { getModeAtual, getModeConfig } from '@/lib/gameMode'

import TelaPerfil, { StatsPerfil } from '@/components/TelaPerfil'
import JogoDesafio from '@/components/JogoDesafio'
import { TelaContratosAtivos } from '@/components/TelaContrato'
import TelaFinalDia from '@/components/TelaFinalDia'
import BotaoNotificacoes, { NotifStatusIcon } from '@/components/BotaoNotificacoes'
import HistoricoDias from '@/components/HistoricoDias'
import { Flame, FileText } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

export default function Home() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregado, setCarregado] = useState(false)
  const [desafioIdx, setDesafioIdx] = useState(0)
  const [mostrarContratosAtivos, setMostrarContratosAtivos] = useState(false)
  const [mostrarFinalDia, setMostrarFinalDia] = useState(false)
  const [qtdContratosAtivos, setQtdContratosAtivos] = useState(0)
  const [jogoKey, setJogoKey] = useState(0)

  const finalDiaMostrado = useRef(false)
  const isInitialLoad = useRef(true)
  const jogoRef = useRef<HTMLDivElement>(null)

  // Modo atual (bola ou copa)
  const mode = getModeAtual()
  const modeConfig = getModeConfig(mode)

  const jogadoresDoDia = getJogadoresDoDia(mode)

  useEffect(() => {
    // Primeira vez: redireciona para seleção de modo
    const jaEscolheuModo = localStorage.getItem('cobradabola_mode')
    if (!jaEscolheuModo) {
      router.replace('/selecionar-modo')
      return
    }
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
    const hoje = new Date().toDateString()
    const jaDispensado = typeof window !== 'undefined' && localStorage.getItem('finalDia_dispensado') === hoje
    if (jaDispensado) return
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
        <div className="text-[#00C853] font-black text-xl tracking-widest">COBRA DA BOLA</div>
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

  const todosConcluidos = totalDesafiosConcluidos === jogadoresDoDia.length
  const nenhumJogadoHoje = totalDesafiosConcluidos === 0

  const pontosHoje = jogadoresDoDia.reduce((sum, { rodadaId }) => {
    const r = getResultadoRodada(rodadaId)
    return sum + (r?.pontos ?? 0)
  }, 0)
  const acertosHoje = jogadoresDoDia.filter(({ rodadaId }) => {
    const r = getResultadoRodada(rodadaId)
    return r?.pistaAcerto != null
  }).length

  return (
    <main className="min-h-screen bg-[#0A1626] text-white">

      {/* ── CONTEÚDO PRINCIPAL ─────────────────────────────── */}
      <div className="max-w-md mx-auto px-4 pt-3 pb-28 space-y-3">

        {/* ── HEADER ───────────────────────────────────────── */}
        <header className="flex items-center justify-between pt-2">
          <button
            onClick={() => router.push('/selecionar-modo')}
            className="flex items-center gap-3 active:opacity-70 transition-opacity"
          >
            <span className="text-3xl">{modeConfig.emoji}</span>
            <div>
              <h1 className="text-2xl font-black tracking-widest text-white leading-none">{modeConfig.name}</h1>
              <p className="text-xs font-semibold tracking-wider leading-none mt-0.5" style={{ color: modeConfig.subtitleColor }}>
                {modeConfig.tagline}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            {/* Botão trocar jogo */}
            <button
              onClick={() => router.push('/selecionar-modo')}
              className="flex items-center gap-1 bg-[#0F1D30] border border-[#1A3A5C] rounded-xl px-3 py-2 text-[#8AB4CC] hover:text-white transition-colors"
            >
              <span className="text-xs font-semibold">Trocar</span>
              <span className="text-xs">{mode === 'bola' ? '⚽' : '🐍'}</span>
            </button>
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
            <NotifStatusIcon />
          </div>
        </header>

        {/* ── STATS ────────────────────────────────────────── */}
        <StatsPerfil perfil={perfil} />

        {/* ── TEASER AMANHÃ / CTA HOJE ─────────────────────── */}
        {todosConcluidos ? (
          <div className="space-y-2">
            <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl px-4 py-4 flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">Desafio de amanhã</p>
                <p className="text-[#8AB4CC] text-xs mt-0.5">Volta amanhã para o novo desafio</p>
              </div>
              <span className="text-[#FFD23F] text-xs font-bold bg-[#FFD23F]/10 border border-[#FFD23F]/20 rounded-lg px-2 py-1">em breve</span>
            </div>
            <a
              href={`https://wa.me/?text=${encodeURIComponent('Tô jogando Cobra da Bola, o quiz de futebol diário! Consegue adivinhar os jogadores com menos pistas que eu? 🐍⚽\n\nhttps://cobra-craque.vercel.app')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20C55A] active:scale-95 text-white font-black rounded-2xl px-4 py-3 text-sm transition-all"
            >
              <span className="text-base">💬</span>
              Desafiar um amigo no WhatsApp
            </a>
          </div>
        ) : nenhumJogadoHoje && perfil.rodadasJogadas > 0 ? (
          <button
            onClick={() => jogoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="w-full bg-[#00C853] hover:bg-[#00E060] active:scale-95 text-[#0A1626] font-black rounded-2xl px-4 py-4 flex items-center gap-3 transition-all"
          >
            <span className="text-2xl">▶️</span>
            <div className="text-left">
              <p className="font-black text-base leading-none">Desafio de hoje disponível!</p>
              <p className="font-semibold text-xs opacity-70 mt-0.5">Toque para jogar</p>
            </div>
          </button>
        ) : null}

        {/* ── DESAFIOS DO DIA ──────────────────────────────── */}
        <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-white font-bold text-sm">Desafios de hoje</p>
            <p className="text-[#8AB4CC] text-xs">{totalDesafiosConcluidos}/{jogadoresDoDia.length} concluídos</p>
          </div>

          <div className="flex gap-2">
            {jogadoresDoDia.map(({ rodadaId }, i) => {
              const status = getStatusDesafio(rodadaId)
              const isAtivo = desafioIdx === i
              const anteriorConcluido = i === 0 || jogadoresDoDia
                .slice(0, i)
                .every(({ rodadaId: rid }) => getStatusDesafio(rid) !== 'jogando')
              const bloqueado = !anteriorConcluido && status === 'jogando'
              return (
                <button
                  key={rodadaId}
                  onClick={() => { if (!bloqueado) setDesafioIdx(i) }}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all flex flex-col items-center gap-1
                    ${bloqueado
                      ? 'bg-[#0A1626] text-[#4A6A8A] border border-[#1A3A5C] cursor-not-allowed'
                      : isAtivo
                        ? 'bg-[#00C853] text-[#0A1626]'
                        : status === 'ganhou'
                          ? 'bg-[#0F1D30] text-[#00C853] border border-[#00C853]/40'
                          : status === 'perdeu'
                            ? 'bg-[#0F1D30] text-red-400 border border-red-900/30'
                            : 'bg-[#1A3050] text-[#8AB4CC] border border-[#1A3A5C]'
                    }`}
                >
                  <span className="text-lg leading-none">
                    {bloqueado ? '🔒' : status === 'ganhou' ? '✅' : status === 'perdeu' ? '❌' : '⚽'}
                  </span>
                  <span className="text-xs">Desafio {i + 1}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── NOTIFICAÇÕES ─────────────────────────────────── */}
        <BotaoNotificacoes apelido={perfil.apelido} />

        {/* ── JOGO OU ESTADO CONCLUÍDO ─────────────────────── */}
        {!todosConcluidos && (
          <div className="flex items-center gap-2 px-1">
            <div className="w-1 h-5 bg-[#00C853] rounded-full shrink-0" />
            <p className="text-white font-black text-sm tracking-wide">
              Desafio {desafioIdx + 1} de {jogadoresDoDia.length}
            </p>
            <div className="flex-1" />
            <p className="text-[#5A8AAA] text-xs">{modeConfig.name}</p>
          </div>
        )}
        <div ref={jogoRef}>
        {todosConcluidos ? (
          <div className="bg-[#071A0F] border border-[#00C853]/30 rounded-2xl p-5 text-center space-y-3">
            <p className="text-4xl">✅</p>
            <p className="text-[#00C853] font-black text-lg">Desafios de hoje concluídos!</p>
            <div className="flex justify-center gap-6">
              <div>
                <p className="text-[#FFD23F] font-black text-2xl">{pontosHoje}</p>
                <p className="text-[#8AB4CC] text-xs">pts hoje</p>
              </div>
              <div className="w-px bg-[#1A3A5C]" />
              <div>
                <p className="text-[#FFD23F] font-black text-2xl">
                  {acertosHoje}<span className="text-[#8AB4CC] text-sm">/{jogadoresDoDia.length}</span>
                </p>
                <p className="text-[#8AB4CC] text-xs">acertos</p>
              </div>
            </div>
            <p className="text-[#5A8AAA] text-xs">🔔 Novos desafios amanhã</p>
          </div>
        ) : (
          <JogoDesafio
            key={`${rodadaAtiva}-${jogoKey}`}
            jogador={jogadorAtivo}
            rodadaId={rodadaAtiva}
            perfil={perfil}
            indiceDesafio={desafioIdx}
            mensagemMotivacional={mensagemMotivacional}
            telaFinalAberta={mostrarFinalDia}
            temBottomNav={true}
            totalPistasMax={modeConfig.totalPistas}
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
        )}

        </div>

        {/* ── HISTÓRICO DE DIAS ────────────────────────────── */}
        {(todosConcluidos || nenhumJogadoHoje) && (
          <HistoricoDias mode={mode} includeToday={todosConcluidos} />
        )}

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
          onFechar={() => {
            localStorage.setItem('finalDia_dispensado', new Date().toDateString())
            setMostrarFinalDia(false)
            setJogoKey(k => k + 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )}
    </main>
  )
}
