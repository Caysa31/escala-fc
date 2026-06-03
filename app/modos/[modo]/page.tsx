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

    // Inicia o primeiro jogo via função centralizada (evita double-play)
    iniciarNovoJogo()
  }, [modoId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Próximo jogo — chamado pelo botão "Jogar Novamente"
  const proximoJogo = useCallback(() => {
    iniciarNovoJogo()
    window.scrollTo(0, 0)
  }, [iniciarNovoJogo])

  if (!carregado) {
    return (
      <div className="min-h-screen bg-[#0A1626] flex items-center justify-center">
        <div className="text-[#8AB4CC] animate-pulse text-lg">⚽ Carregando...</div>
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
    <main className="min-h-screen bg-[#0A1626] text-white">
      <div className="max-w-md mx-auto px-4 pt-5 pb-10 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/modos" className="p-2 rounded-xl bg-[#0F1D30] border border-[#1A3A5C] hover:border-[#00C853]/30 transition-all shrink-0">
              <ArrowLeft size={18} className="text-[#8AB4CC]" />
            </Link>
            <div className="flex-1 text-center">
              <h1 className={`text-2xl font-black tracking-tight ${modo.corTexto}`}>
                {modo.emoji} {modo.label}
              </h1>
              <p className="text-[#8AB4CC] text-xs mt-0.5">{restantes} partidas restantes hoje</p>
            </div>
            <div className="w-9 shrink-0" />
          </div>

          <div className="flex items-center gap-2">
            {bonusAmanha > 1 && (
              <div className="bg-[#1A0F00] border border-orange-800/40 rounded-xl px-3 py-2 text-center">
                <p className="text-orange-400 font-black text-base leading-none">×{bonusAmanha}</p>
                <p className="text-orange-800 text-xs">amanhã</p>
              </div>
            )}
            <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl px-3 py-2 text-center">
              <p className="text-[#FFD23F] font-black text-xl leading-none">{perfil.pontosTotal}</p>
              <p className="text-[#8AB4CC] text-xs">pts total</p>
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
            <p className="text-[#5A8AAA] animate-pulse">Carregando jogador...</p>
          </div>
        )}

      </div>
    </main>

    {/* ── Tela de resultado fullscreen (modo extra) ─────────────── */}
    {resultado && (
      <div className="fixed inset-0 z-50 bg-[#0A1626] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-full max-w-sm space-y-6">

          <div className="text-6xl">{resultado.ganhou ? '🎯' : '😅'}</div>

          <div className="space-y-1">
            <p className={`text-2xl font-black tracking-tight ${resultado.ganhou ? 'text-[#00C853]' : 'text-red-400'}`}>
              {resultado.ganhou ? 'Acertou!' : 'Não foi dessa vez'}
            </p>
            <p className="text-white font-bold text-xl">
              {resultado.jogadorNome} {resultado.jogadorBandeira}
            </p>
          </div>

          {resultado.ganhou && resultado.pontos > 0 && (
            <div className="bg-[#071A0F] border border-[#00C853]/30 rounded-2xl py-4 px-6">
              <p className="text-[#8AB4CC] text-sm">Pontos ganhos</p>
              <p className="text-[#FFD23F] font-black text-5xl mt-1">+{resultado.pontos}</p>
            </div>
          )}

          {resultado.ganhou && bonusAmanha > 1 && (
            <div className="bg-[#1A0F00] border border-orange-800/40 rounded-xl py-3 px-4">
              <p className="text-orange-300 text-sm font-semibold">
                🏋️ Bônus de amanhã: <span className="text-orange-400 font-black">×{bonusAmanha}</span>
              </p>
            </div>
          )}

          <div className="space-y-3">
            {restantes > 0 ? (
              <button
                onClick={() => { setResultado(null); proximoJogo() }}
                className="w-full bg-[#00C853] hover:bg-[#00E060] active:scale-95 text-[#0A1626] font-black text-lg py-4 rounded-2xl transition-all"
              >
                Jogar Novamente →
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl py-3 px-4">
                  <p className="text-[#8AB4CC] text-sm">🔒 Limite diário atingido</p>
                  <p className="text-[#5A8AAA] text-xs mt-1">Volte amanhã para mais partidas!</p>
                </div>
                <button
                  onClick={() => setResultado(null)}
                  className="w-full bg-[#0F1D30] border border-[#1A3A5C] active:scale-95 text-white font-bold text-base py-3 rounded-xl transition-all"
                >
                  Ver resultado final
                </button>
              </div>
            )}
            <button onClick={() => setResultado(null)} className="text-[#5A8AAA] text-sm underline underline-offset-4">
              Ver pistas
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  )
}
