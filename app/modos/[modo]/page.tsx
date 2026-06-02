'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Perfil, Jogador } from '@/lib/types'
import { carregarPerfil } from '@/lib/perfil'
import jogadoresData from '@/data/jogadores.json'

const todosJogadores = jogadoresData as Jogador[]
import {
  ModoId, getModoConfig, getJogadorAleatorio,
  getModoPlaysHoje, getModoPlayedIdsHoje,
  incrementarModoPlays, registrarModoJogadorId,
  MAX_PLAYS_POR_DIA, registrarTreinoHoje, getBonusAmanha,
} from '@/lib/modos'

import JogoDesafio from '@/components/JogoDesafio'
import TelaPerfil from '@/components/TelaPerfil'

export default function ModoPage() {
  const params = useParams()
  const router = useRouter()
  const modoId = params.modo as ModoId

  const modo = getModoConfig(modoId)

  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregado, setCarregado] = useState(false)
  const [jogoAtual, setJogoAtual] = useState<{ jogadorId: number; rodadaId: number } | null>(null)
  const [playsHoje, setPlaysHoje] = useState(0)
  const [bonusAmanha, setBonusAmanha] = useState(1)
  const [resultado, setResultado] = useState<{ ganhou: boolean; pontos: number; jogadorNome: string; jogadorBandeira: string } | null>(null)

  // Carrega jogador aleatório para a partida atual
  const iniciarNovoJogo = useCallback(() => {
    if (!modo) return
    const excluidos = getModoPlayedIdsHoje(modoId)
    const jogador = getJogadorAleatorio(modoId, excluidos)
    // rodadaId único por partida extra (range alto para não colidir com diários)
    const rodadaId = 1_000_000 + Date.now() % 1_000_000
    registrarModoJogadorId(modoId, jogador.id)
    incrementarModoPlays(modoId)
    setPlaysHoje(getModoPlaysHoje(modoId))
    setJogoAtual({ jogadorId: jogador.id, rodadaId })
  }, [modoId, modo])

  useEffect(() => {
    const p = carregarPerfil()
    setPerfil(p)
    setPlaysHoje(getModoPlaysHoje(modoId))
    setBonusAmanha(getBonusAmanha())
    setCarregado(true)

    if (!getModoConfig(modoId)) {
      router.replace('/modos')
      return
    }

    // Inicia o primeiro jogo automaticamente
    const excluidos = getModoPlayedIdsHoje(modoId)
    const jogador = getJogadorAleatorio(modoId, excluidos)
    const rodadaId = 1_000_000 + Date.now() % 1_000_000
    registrarModoJogadorId(modoId, jogador.id)
    incrementarModoPlays(modoId)
    setPlaysHoje(getModoPlaysHoje(modoId))
    setJogoAtual({ jogadorId: jogador.id, rodadaId })
  }, [modoId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Próximo jogo — chamado pelo botão "Jogar Novamente"
  const proximoJogo = useCallback(() => {
    iniciarNovoJogo()
    window.scrollTo(0, 0)
  }, [iniciarNovoJogo])

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

  if (!modo) return null

  const restantes = MAX_PLAYS_POR_DIA - playsHoje

  const jogadorAtual = jogoAtual
    ? todosJogadores.find(j => j.id === jogoAtual.jogadorId) ?? null
    : null

  return (<>
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/modos"
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-all"
            >
              <ArrowLeft size={18} className="text-zinc-400" />
            </Link>
            <div>
              <h1 className={`text-lg font-black tracking-tight ${modo.corTexto}`}>
                {modo.emoji} {modo.label}
              </h1>
              <p className="text-zinc-500 text-xs">{restantes} partidas restantes hoje</p>
            </div>
          </div>

          {/* Bônus de amanhã / Pontos */}
          <div className="flex items-center gap-2">
            {bonusAmanha > 1 && (
              <div className="bg-orange-950 border border-orange-800 rounded-xl px-3 py-2 text-center">
                <p className="text-orange-400 font-black text-base leading-none">×{bonusAmanha}</p>
                <p className="text-orange-600 text-xs">amanhã</p>
              </div>
            )}
            <div className="bg-zinc-800 rounded-xl px-3 py-2 text-center">
              <p className="text-yellow-400 font-black text-base leading-none">{perfil.pontosTotal}</p>
              <p className="text-zinc-500 text-xs">pts total</p>
            </div>
          </div>
        </div>

        {/* Jogo */}
        {jogadorAtual && jogoAtual ? (
          <JogoDesafio
            key={jogoAtual.rodadaId}
            jogador={jogadorAtual}
            rodadaId={jogoAtual.rodadaId}
            perfil={perfil}
            indiceDesafio={0}
            modoExtra={true}
            totalPistasMax={modo.totalPistas}
            labelProximoDesafio="Jogar Novamente →"
            mensagemFimJogo={restantes <= 0 ? '🔒 Limite diário atingido. Volte amanhã!' : undefined}
            onResultado={p => setPerfil(p)}
            onContratosChange={() => {}}
            onFimJogo={(r) => {
              registrarTreinoHoje()
              setBonusAmanha(getBonusAmanha())
              setResultado({
                ganhou: r.ganhou,
                pontos: r.pontos,
                jogadorNome: jogadorAtual?.nome ?? '',
                jogadorBandeira: jogadorAtual?.bandeira ?? '',
              })
            }}
            onProximoDesafio={restantes > 0 ? proximoJogo : undefined}
          />
        ) : (
          <div className="flex items-center justify-center py-20">
            <p className="text-zinc-500 animate-pulse">Carregando jogador...</p>
          </div>
        )}

      </div>
    </main>

    {/* ── Tela de resultado fullscreen (modo extra) ─────────────── */}
    {resultado && (
      <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-full max-w-sm space-y-6">

          {/* Ícone de estado */}
          <div className="text-6xl">
            {resultado.ganhou ? '🎯' : '😅'}
          </div>

          {/* Título */}
          <div className="space-y-1">
            <p className={`text-2xl font-black tracking-tight ${resultado.ganhou ? 'text-green-300' : 'text-red-400'}`}>
              {resultado.ganhou ? 'Acertou!' : 'Não foi dessa vez'}
            </p>
            <p className="text-white font-bold text-xl">
              {resultado.jogadorNome} {resultado.jogadorBandeira}
            </p>
          </div>

          {/* Pontos */}
          {resultado.ganhou && resultado.pontos > 0 && (
            <div className="bg-green-950 border border-green-800 rounded-2xl py-4 px-6">
              <p className="text-zinc-400 text-sm">Pontos ganhos</p>
              <p className="text-yellow-400 font-black text-4xl mt-1">+{resultado.pontos}</p>
            </div>
          )}

          {/* Progresso de treino */}
          {bonusAmanha > 1 && (
            <div className="bg-orange-950 border border-orange-800 rounded-xl py-3 px-4">
              <p className="text-orange-300 text-sm font-semibold">
                🏋️ Bônus de amanhã: <span className="text-orange-400 font-black">×{bonusAmanha}</span>
              </p>
            </div>
          )}

          {/* Botão de ação */}
          <div className="space-y-3">
            {restantes > 0 ? (
              <button
                onClick={() => { setResultado(null); proximoJogo() }}
                className="w-full bg-green-600 hover:bg-green-500 active:scale-95 text-white font-black text-lg py-4 rounded-2xl transition-all"
              >
                Jogar Novamente →
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-zinc-900 border border-zinc-700 rounded-xl py-3 px-4">
                  <p className="text-zinc-400 text-sm">🔒 Limite diário atingido</p>
                  <p className="text-zinc-500 text-xs mt-1">Volte amanhã para mais partidas!</p>
                </div>
                <button
                  onClick={() => setResultado(null)}
                  className="w-full bg-zinc-700 hover:bg-zinc-600 active:scale-95 text-white font-bold text-base py-3 rounded-xl transition-all"
                >
                  Ver resultado final
                </button>
              </div>
            )}

            <button
              onClick={() => setResultado(null)}
              className="text-zinc-600 text-sm underline underline-offset-4"
            >
              Ver pistas
            </button>
          </div>

        </div>
      </div>
    )}
  </>
  )
}
