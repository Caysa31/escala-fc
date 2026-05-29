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
  indiceDesafio: number  // 0 = primeiro, 1 = segundo, 2 = terceiro
  mensagemMotivacional?: string  // exibida no topo quando o desafio anterior foi perdido
  onResultado: (perfilAtualizado: Perfil) => void
  onContratosChange: (qtd: number) => void
  onProximoDesafio?: () => void
}

export default function JogoDesafio({
  jogador, rodadaId, perfil, indiceDesafio, mensagemMotivacional,
  onResultado, onContratosChange, onProximoDesafio,
}: Props) {
  const pistasTexto = getPistasTexto(jogador)
  const introNarrativa = getIntroNarrativa(jogador)

  // No primeiro desafio, começa com pistaAtual=0 (nenhuma pista revelada)
  // para dar protagonismo à intro narrativa.
  // Nos demais, começa em 1 (pista 1 já aberta).
  const isFirstRodada = indiceDesafio === 0

  const [estado, setEstado] = useState<EstadoJogo>({
    pistaAtual: isFirstRodada ? 0 : 1,
    tentativas: [],
    status: 'jogando',
    pistaUsada: null,
  })
  const [mostrarContrato, setMostrarContrato] = useState(false)
  const [mostrarResultado, setMostrarResultado] = useState(false)
  const [autoAvancando, setAutoAvancando] = useState(false)

  // Carrega progresso salvo ao montar (ou ao trocar de rodada)
  useEffect(() => {
    // Volta pro topo da tela ao entrar num novo desafio
    window.scrollTo({ top: 0, behavior: 'smooth' })

    const resultado = getResultadoRodada(rodadaId)
    if (resultado) {
      setEstado({
        pistaAtual: resultado.pistaAcerto ?? TOTAL_PISTAS,
        tentativas: resultado.tentativas,
        status: resultado.pistaAcerto !== null ? 'ganhou' : 'perdeu',
        pistaUsada: resultado.pistaAcerto,
      })
    } else {
      // Fresh game — primeiro desafio começa sem pistas abertas
      setEstado({ pistaAtual: indiceDesafio === 0 ? 0 : 1, tentativas: [], status: 'jogando', pistaUsada: null })
    }
    setMostrarContrato(false)
    setMostrarResultado(false)
    setAutoAvancando(false)
  }, [rodadaId]) // eslint-disable-line react-hooks/exhaustive-deps

  function handlePalpite(nome: string) {
    if (estado.status !== 'jogando') return

    const acertou = verificarPalpite(nome, jogador)
    const novaTentativa: Tentativa = { nome, status: acertou ? 'acerto' : 'erro' }
    const novasTentativas = [...estado.tentativas, novaTentativa]

    // pistaAtual=0 é tratado como pista 1 para fins de pontuação e salvamento
    const pistaEfetiva = Math.max(1, estado.pistaAtual)

    if (acertou) {
      const pontos = calcularPontos(pistaEfetiva)
      const novoEstado: EstadoJogo = {
        ...estado,
        tentativas: novasTentativas,
        status: 'ganhou',
        pistaUsada: pistaEfetiva,
      }
      setEstado(novoEstado)

      if (perfil) {
        const perfilAtualizado = registrarResultado(perfil, {
          rodadaId,
          jogadorId: jogador.id,
          pistaAcerto: pistaEfetiva,
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
        // Salva o resultado independente do fluxo
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

        // Desafio 1 ou 2: auto-avança pro próximo sem abrir modal
        if (indiceDesafio < 2 && onProximoDesafio) {
          setAutoAvancando(true)
          setTimeout(() => {
            setAutoAvancando(false)
            onProximoDesafio()
          }, 1800)
        } else {
          // Último desafio: mostra resultado e TelaFinalDia cuida do resto
          setMostrarResultado(true)
        }
      }
    }
  }

  const pontosRodada = estado.pistaUsada ? calcularPontos(estado.pistaUsada) : 0

  // Intro narrativa em destaque quando ainda não há pistas reveladas (primeiro desafio, estado inicial)
  const introEmDestaque = isFirstRodada && estado.pistaAtual === 0 && estado.status === 'jogando'

  return (
    <div className="space-y-4">

      {/* Banner motivacional (desafio anterior foi perdido) */}
      {mensagemMotivacional && (
        <div className="bg-blue-950 border border-blue-800 rounded-xl px-4 py-3 text-center">
          <p className="text-blue-300 text-sm font-semibold">{mensagemMotivacional}</p>
        </div>
      )}

      {/* Status da rodada */}
      {estado.status === 'jogando' && (
        <div className={`rounded-xl px-4 py-3 text-center ${introEmDestaque ? 'bg-green-950 border border-green-800' : 'bg-zinc-800'}`}>
          {introEmDestaque ? (
            <p className="text-sm text-green-300">
              ✨ Adivinhe pelo histórico — Vale{' '}
              <span className="text-yellow-400 font-bold">100 pts</span>
            </p>
          ) : (
            <p className="text-sm text-zinc-300">
              Pista{' '}
              <span className="text-green-400 font-bold">{estado.pistaAtual}</span>
              {' '}de {TOTAL_PISTAS} · Vale{' '}
              <span className="text-yellow-400 font-bold">{PONTOS_BASE[estado.pistaAtual]} pts</span>
            </p>
          )}
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
          {autoAvancando ? (
            <p className="text-zinc-500 text-xs animate-pulse">
              Avançando pro próximo desafio...
            </p>
          ) : (
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
          )}
        </div>
      )}

      {/* Intro narrativa */}
      <div className={`rounded-xl px-4 py-5 transition-all duration-500 ${
        introEmDestaque
          ? 'bg-zinc-900 border-2 border-green-500 shadow-lg shadow-green-900/40'
          : 'bg-zinc-900 border border-zinc-700'
      }`}>
        <p className={`text-xs uppercase font-bold tracking-widest mb-3 ${
          introEmDestaque ? 'text-green-400' : 'text-zinc-500'
        }`}>
          ⚡ Jogador do dia
        </p>
        <p className={`leading-relaxed italic ${
          introEmDestaque
            ? 'text-white text-base font-medium'
            : 'text-zinc-200 text-sm'
        }`}>
          &ldquo;{introNarrativa}&rdquo;
        </p>
        {introEmDestaque && (
          <p className="text-green-600 text-xs mt-3 font-semibold">
            Quem é esse jogador? Tente adivinhar agora.
          </p>
        )}
      </div>

      {/* Pistas */}
      <div className="space-y-2">
        {Array.from({ length: TOTAL_PISTAS }, (_, i) => i + 1).map(num => {
          const revelada = num <= estado.pistaAtual
          const atual = num === estado.pistaAtual && estado.status === 'jogando'
          // Pista ficou vermelha se foi revelada, não é a atual e não é a pista de acerto
          const errou = revelada && (num < estado.pistaAtual || estado.status === 'perdeu')
          // Pista fica verde permanente se foi onde o jogador acertou
          const correto = estado.status === 'ganhou' && num === estado.pistaUsada
          // No 1º desafio, pista 1 é clicável para revelar quando ainda não há pistas abertas
          const onRevelar = isFirstRodada && estado.pistaAtual === 0 && num === 1 && estado.status === 'jogando'
            ? () => setEstado(e => ({ ...e, pistaAtual: 1 }))
            : undefined
          return (
            <Pista
              key={num}
              numero={num}
              texto={pistasTexto[num] ?? ''}
              revelada={revelada}
              atual={atual}
              errou={errou}
              correto={correto}
              onRevelar={onRevelar}
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
          onProximoDesafio={onProximoDesafio ? () => {
            setMostrarContrato(false)
            onContratosChange(getContratosAtivos().length)
            onProximoDesafio()
          } : undefined}
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
          onProximoDesafio={onProximoDesafio}
        />
      )}
    </div>
  )
}
