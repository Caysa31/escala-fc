'use client'

import { useState, useEffect } from 'react'
import {
  Perfil, Tentativa, EstadoJogo,
  PONTOS_BASE, TOTAL_PISTAS, TIPO_PISTAS,
} from '@/lib/types'
import {
  getJogadorDoDia, getPistasTexto, getIntroNarrativa,
  verificarPalpite, calcularPontos,
} from '@/lib/game'
import { carregarPerfil, registrarResultado, getResultadoRodada } from '@/lib/perfil'
import { assinarContrato, getContratoRodada, getContratosAtivos } from '@/lib/contrato'

import TelaPerfil, { StatsPerfil } from '@/components/TelaPerfil'
import Pista from '@/components/Pista'
import InputPalpite from '@/components/InputPalpite'
import ListaTentativas from '@/components/ListaTentativas'
import TelaResultado from '@/components/TelaResultado'
import { ModalContrato, TelaContratosAtivos } from '@/components/TelaContrato'
import { Flame, FileText, Globe, Users } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregado, setCarregado] = useState(false)
  const [mostrarResultado, setMostrarResultado] = useState(false)
  const [mostrarContrato, setMostrarContrato] = useState(false)
  const [mostrarContratosAtivos, setMostrarContratosAtivos] = useState(false)
  const [qtdContratosAtivos, setQtdContratosAtivos] = useState(0)

  const { jogador, rodadaId } = getJogadorDoDia()
  const pistasTexto = getPistasTexto(jogador)
  const introNarrativa = getIntroNarrativa(jogador)

  const [estado, setEstado] = useState<EstadoJogo>({
    pistaAtual: 1,
    tentativas: [],
    status: 'jogando',
    pistaUsada: null,
  })

  useEffect(() => {
    const p = carregarPerfil()
    setPerfil(p)

    if (p) {
      const resultado = getResultadoRodada(rodadaId)
      if (resultado) {
        setEstado({
          pistaAtual: resultado.pistaAcerto ?? TOTAL_PISTAS,
          tentativas: resultado.tentativas,
          status: resultado.pistaAcerto !== null ? 'ganhou' : 'perdeu',
          pistaUsada: resultado.pistaAcerto,
        })
      }
    }

    setQtdContratosAtivos(getContratosAtivos().length)
    setCarregado(true)
  }, [rodadaId])

  function handlePalpite(nome: string) {
    if (estado.status !== 'jogando') return

    const acertou = verificarPalpite(nome, jogador)
    const novaTentativa: Tentativa = { nome, status: acertou ? 'acerto' : 'erro' }
    const novasTentativas = [...estado.tentativas, novaTentativa]

    if (acertou) {
      const pontos = calcularPontos(estado.pistaAtual)
      const novoEstado: EstadoJogo = {
        ...estado,
        tentativas: novasTentativas,
        status: 'ganhou',
        pistaUsada: estado.pistaAtual,
      }
      setEstado(novoEstado)

      if (perfil) {
        const perfilAtualizado = registrarResultado(perfil, {
          rodadaId,
          jogadorId: jogador.id,
          pistaAcerto: estado.pistaAtual,
          pontos,
          tentativas: novasTentativas,
        })
        setPerfil(perfilAtualizado)
      }

      // Mostrar contrato imediatamente após acertar
      setMostrarContrato(true)

    } else {
      const novaPista = estado.pistaAtual + 1
      const acabou = novaPista > TOTAL_PISTAS

      const novoEstado: EstadoJogo = {
        ...estado,
        tentativas: novasTentativas,
        pistaAtual: acabou ? TOTAL_PISTAS : novaPista,
        status: acabou ? 'perdeu' : 'jogando',
        pistaUsada: null,
      }
      setEstado(novoEstado)

      if (acabou) {
        setMostrarResultado(true)
        if (perfil) {
          const perfilAtualizado = registrarResultado(perfil, {
            rodadaId,
            jogadorId: jogador.id,
            pistaAcerto: null,
            pontos: 0,
            tentativas: novasTentativas,
          })
          setPerfil(perfilAtualizado)
        }
      }
    }
  }

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

  const pontosRodada = estado.pistaUsada ? calcularPontos(estado.pistaUsada) : 0

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">⚽ ESCALA FC</h1>
            <p className="text-zinc-500 text-xs">
              Rodada #{rodadaId} · {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
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

        {/* Status da rodada */}
        {estado.status === 'jogando' && (
          <div className="bg-zinc-800 rounded-xl px-4 py-3 text-center">
            <p className="text-sm text-zinc-300">
              Pista{' '}
              <span className="text-green-400 font-bold">{estado.pistaAtual}</span>
              {' '}de {TOTAL_PISTAS} · Vale{' '}
              <span className="text-yellow-400 font-bold">{PONTOS_BASE[estado.pistaAtual]} pts</span>
            </p>
          </div>
        )}

        {estado.status === 'ganhou' && (
          <div className="bg-green-950 border border-green-700 rounded-xl px-4 py-3 text-center">
            <p className="text-green-300 font-bold">
              🎯 Acertou na pista {estado.pistaUsada}! +{pontosRodada} pts
            </p>
            <button
              onClick={() => setMostrarResultado(true)}
              className="text-green-500 text-xs underline mt-1"
            >
              Ver resultado e compartilhar
            </button>
          </div>
        )}

        {estado.status === 'perdeu' && (
          <div className="bg-red-950 border border-red-900 rounded-xl px-4 py-3 text-center">
            <p className="text-red-300 font-bold">
              Era <span className="text-white">{jogador.nome}</span> {jogador.bandeira}
            </p>
            <button
              onClick={() => setMostrarResultado(true)}
              className="text-red-400 text-xs underline mt-1"
            >
              Ver resultado e compartilhar
            </button>
          </div>
        )}

        {/* ── Intro narrativa ── */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-4">
          <p className="text-xs text-zinc-500 uppercase font-semibold tracking-widest mb-2">
            ⚡ Jogador do dia
          </p>
          <p className="text-zinc-200 text-sm leading-relaxed italic">
            "{introNarrativa}"
          </p>
        </div>

        {/* ── Pistas ── */}
        <div className="space-y-2">
          {Array.from({ length: TOTAL_PISTAS }, (_, i) => i + 1).map(num => {
            const revelada = num <= estado.pistaAtual
            const atual = num === estado.pistaAtual && estado.status === 'jogando'
            return (
              <Pista
                key={num}
                numero={num}
                texto={pistasTexto[num] ?? ''}
                revelada={revelada}
                atual={atual}
              />
            )
          })}
        </div>

        {/* Input */}
        {estado.status === 'jogando' && (
          <InputPalpite
            onPalpite={handlePalpite}
            desabilitado={false}
            tentativasAnteriores={estado.tentativas.map(t => t.nome)}
          />
        )}

        {/* Tentativas */}
        <ListaTentativas tentativas={estado.tentativas} />

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

      {/* ── Modais ── */}

      {/* Contrato (aparece após acertar) */}
      {mostrarContrato && estado.pistaUsada && (
        <ModalContrato
          jogador={jogador}
          rodadaId={rodadaId}
          pistaAcerto={estado.pistaUsada}
          onFechar={() => {
            setMostrarContrato(false)
            setMostrarResultado(true)
            setQtdContratosAtivos(getContratosAtivos().length)
          }}
        />
      )}

      {/* Resultado + compartilhar */}
      {mostrarResultado && !mostrarContrato && (
        <TelaResultado
          jogador={jogador}
          rodadaId={rodadaId}
          pistaAcerto={estado.pistaUsada}
          pontos={pontosRodada}
          tentativas={estado.tentativas}
          onFechar={() => setMostrarResultado(false)}
        />
      )}

      {/* Lista de contratos ativos */}
      {mostrarContratosAtivos && (
        <TelaContratosAtivos onFechar={() => setMostrarContratosAtivos(false)} />
      )}
    </main>
  )
}
