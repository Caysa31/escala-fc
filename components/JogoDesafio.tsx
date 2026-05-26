'use client'

import { useState, useEffect } from 'react'
import {
  Perfil, Tentativa, EstadoJogo,
  PONTOS_BASE, TOTAL_PISTAS, Jogador,
} from '@/lib/types'
import {
  getPistasTexto, getIntroNarrativa,
  verificarPalpite, calcularPontos,
} from '@/lib/game'
import { registrarResultado, getResultadoRodada } from '@/lib/perfil'
import { getContratosAtivos } from '@/lib/contrato'

import Pista from './Pista'
import InputPalpite from './InputPalpite'
import ListaTentativas from './ListaTentativas'
import TelaResultado from './TelaResultado'
import { ModalContrato } from './TelaContrato'

interface Props {
  jogador: Jogador
  rodadaId: number
  perfil: Perfil | null
  onResultado: (perfilAtualizado: Perfil) => void
  onContratosChange: (qtd: number) => void
  onProximoDesafio?: () => void  // Se existir, mostra botão "Próximo desafio"
}

export default function JogoDesafio({
  jogador, rodadaId, perfil, onResultado, onContratosChange, onProximoDesafio,
}: Props) {
  const pistasTexto = getPistasTexto(jogador)
  const introNarrativa = getIntroNarrativa(jogador)

  const [estado, setEstado] = useState<EstadoJogo>({
    pistaAtual: 1,
    tentativas: [],
    status: 'jogando',
    pistaUsada: null,
  })
  const [mostrarContrato, setMostrarContrato] = useState(false)
  const [mostrarResultado, setMostrarResultado] = useState(false)

  // Carrega progresso salvo ao montar (ou ao trocar de rodada)
  useEffect(() => {
    const resultado = getResultadoRodada(rodadaId)
    if (resultado) {
      setEstado({
        pistaAtual: resultado.pistaAcerto ?? TOTAL_PISTAS,
        tentativas: resultado.tentativas,
        status: resultado.pistaAcerto !== null ? 'ganhou' : 'perdeu',
        pistaUsada: resultado.pistaAcerto,
      })
    } else {
      setEstado({ pistaAtual: 1, tentativas: [], status: 'jogando', pistaUsada: null })
    }
    setMostrarContrato(false)
    setMostrarResultado(false)
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
        onResultado(perfilAtualizado)
      }

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
          onResultado(perfilAtualizado)
        }
      }
    }
  }

  const pontosRodada = estado.pistaUsada ? calcularPontos(estado.pistaUsada) : 0

  return (
    <div className="space-y-4">

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
        <div className="bg-green-950 border border-green-700 rounded-xl px-4 py-3 text-center space-y-2">
          <p className="text-green-300 font-bold">
            🎯 Acertou na pista {estado.pistaUsada}! +{pontosRodada} pts
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setMostrarResultado(true)}
              className="text-green-500 text-xs underline"
            >
              Ver resultado
            </button>
            {onProximoDesafio && (
              <button
                onClick={onProximoDesafio}
                className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-all"
              >
                Próximo desafio →
              </button>
            )}
          </div>
        </div>
      )}

      {estado.status === 'perdeu' && (
        <div className="bg-red-950 border border-red-900 rounded-xl px-4 py-3 text-center space-y-2">
          <p className="text-red-300 font-bold">
            Era <span className="text-white">{jogador.nome}</span> {jogador.bandeira}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setMostrarResultado(true)}
              className="text-red-400 text-xs underline"
            >
              Ver resultado
            </button>
            {onProximoDesafio && (
              <button
                onClick={onProximoDesafio}
                className="bg-zinc-600 hover:bg-zinc-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-all"
              >
                Próximo desafio →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Intro narrativa */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-4">
        <p className="text-xs text-zinc-500 uppercase font-semibold tracking-widest mb-2">
          ⚡ Jogador do dia
        </p>
        <p className="text-zinc-200 text-sm leading-relaxed italic">
          &ldquo;{introNarrativa}&rdquo;
        </p>
      </div>

      {/* Pistas */}
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

      {/* Modal contrato (após acertar) */}
      {mostrarContrato && estado.pistaUsada && (
        <ModalContrato
          jogador={jogador}
          rodadaId={rodadaId}
          pistaAcerto={estado.pistaUsada}
          onFechar={() => {
            setMostrarContrato(false)
            setMostrarResultado(true)
            onContratosChange(getContratosAtivos().length)
          }}
        />
      )}

      {/* Tela de resultado */}
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
    </div>
  )
}
