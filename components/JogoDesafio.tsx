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
import { registrarResultado, getResultadoRodada, aplicarBonusContrato } from '@/lib/perfil'
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
  telaFinalAberta?: boolean      // suprime TelaResultado quando TelaFinalDia está visível
  onResultado: (perfilAtualizado: Perfil) => void
  onContratosChange: (qtd: number) => void
  onProximoDesafio?: () => void
}

export default function JogoDesafio({
  jogador, rodadaId, perfil, indiceDesafio, mensagemMotivacional,
  telaFinalAberta,
  onResultado, onContratosChange, onProximoDesafio,
}: Props) {
  const pistasTexto = getPistasTexto(jogador)
  const introNarrativa = getIntroNarrativa(jogador)

  // Label do Capítulo 2 varia por posição — identidade narrativa antes de revelar o estilo de jogo
  const chapterLabelPosicao: Record<string, string> = {
    'Goleiro':          'O Guardião',
    'Zagueiro':         'O Muro',
    'Lateral-direito':  'O Corredor',
    'Lateral-esquerdo': 'O Corredor',
    'Lateral':          'O Corredor',
    'Volante':          'O Escudo',
    'Meia':             'O Maestro',
    'Meia-atacante':    'O Artista',
    'Ponta':            'O Relâmpago',
    'Ponta-direita':    'O Relâmpago',
    'Ponta-esquerda':   'O Relâmpago',
    'Atacante':         'O Artilheiro',
    'Centroavante':     'O Artilheiro',
  }
  const subtituloPista2 = chapterLabelPosicao[jogador.posicao] ?? 'O Dom'

  // Todos os desafios começam com pistaAtual=0 (nenhuma pista revelada)
  // para dar protagonismo à intro narrativa — 6 oportunidades consistentes em todos.
  const isFirstRodada = indiceDesafio === 0

  const [estado, setEstado] = useState<EstadoJogo>({
    pistaAtual: 0,
    tentativas: [],
    status: 'jogando',
    pistaUsada: null,
  })
  const [mostrarContrato, setMostrarContrato] = useState(false)
  const [mostrarResultado, setMostrarResultado] = useState(false)
  const [inputMontado, setInputMontado] = useState(false)

  // Carrega progresso salvo ao montar (ou ao trocar de rodada)
  useEffect(() => {
    // 1. Desmonta o input para o iOS não focar e rolar a tela
    setInputMontado(false)

    // 2. Rola pro topo instantaneamente (sem input na DOM, iOS não interfere)
    window.scrollTo(0, 0)

    const resultado = getResultadoRodada(rodadaId)
    if (resultado) {
      setEstado({
        pistaAtual: resultado.pistaAcerto ?? TOTAL_PISTAS,
        tentativas: resultado.tentativas,
        status: resultado.pistaAcerto !== null ? 'ganhou' : 'perdeu',
        pistaUsada: resultado.pistaAcerto,
      })
    } else {
      setEstado({ pistaAtual: 0, tentativas: [], status: 'jogando', pistaUsada: null })
    }
    setMostrarContrato(false)
    setMostrarResultado(false)

    // 3. Monta o input depois que a tela já está no topo
    const timer = setTimeout(() => setInputMontado(true), 400)
    return () => clearTimeout(timer)
  }, [rodadaId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Avança para a próxima pista sem digitar nome (custa uma tentativa)
  function handleDestravar() {
    handlePalpite('—')
  }

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
        // Sempre abre TelaResultado na derrota — igual à vitória que abre ModalContrato
        // Para o último desafio, TelaFinalDia aparece por cima via useEffect do pai
        setMostrarResultado(true)
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
        <div className="bg-green-950 border border-green-700 rounded-2xl px-5 py-5 text-center space-y-3">
          {/* Pontuação em destaque */}
          <div>
            <p className="text-green-300 font-bold text-base">
              🎯 Acertou na pista {estado.pistaUsada}!
            </p>
            <p className="text-yellow-400 font-black text-3xl mt-1">+{pontosRodada} pts</p>
          </div>

          {onProximoDesafio ? (
            /* Desafios 1 ou 2 — tem próximo desafio */
            <div className="space-y-2">
              <p className="text-zinc-300 text-sm">
                Você ainda pode aumentar sua pontuação!
              </p>
              <button
                onClick={onProximoDesafio}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-sm transition-all"
              >
                Próximo desafio →
              </button>
              <button
                onClick={() => setMostrarResultado(true)}
                className="text-zinc-500 text-xs underline"
              >
                Ver detalhes
              </button>
            </div>
          ) : (
            /* Desafio 3 — TelaFinalDia abre automaticamente via useEffect */
            <p className="text-zinc-400 text-xs animate-pulse">
              Calculando resultado do dia...
            </p>
          )}
        </div>
      )}

      {estado.status === 'perdeu' && (
        <div className="bg-red-950 border border-red-900 rounded-2xl px-5 py-5 text-center space-y-3">
          <div>
            <p className="text-red-400 text-sm font-semibold">Não foi dessa vez...</p>
            <p className="text-white font-black text-2xl mt-1">
              {jogador.nome} {jogador.bandeira}
            </p>
          </div>
          {onProximoDesafio ? (
            <div className="space-y-2">
              <button
                onClick={onProximoDesafio}
                className="w-full bg-zinc-600 hover:bg-zinc-500 text-white font-bold py-3 rounded-xl text-sm transition-all"
              >
                Próximo desafio →
              </button>
              <button
                onClick={() => setMostrarResultado(true)}
                className="text-zinc-500 text-xs underline"
              >
                Ver detalhes
              </button>
            </div>
          ) : (
            <button
              onClick={() => setMostrarResultado(true)}
              className="text-red-400 text-xs underline"
            >
              Ver resultado
            </button>
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
          // Botão "Ver próxima dica" aparece apenas na pista seguinte à atual (quando em jogo)
          const onDestravar = estado.status === 'jogando' &&
            estado.pistaAtual >= 1 &&
            num === estado.pistaAtual + 1 &&
            !onRevelar
            ? handleDestravar
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
              subtitulo={num === 2 ? subtituloPista2 : undefined}
              onRevelar={onRevelar}
              onDestravar={onDestravar}
            />
          )
        })}
      </div>

      {/* Tentativas */}
      <ListaTentativas tentativas={estado.tentativas} />

      {/* Espaço para o input fixo não cobrir o conteúdo */}
      {estado.status === 'jogando' && <div className="h-28" />}

      {/* Modal contrato (após acertar) */}
      {mostrarContrato && estado.pistaUsada && (
        <ModalContrato
          jogador={jogador}
          rodadaId={rodadaId}
          pistaAcerto={estado.pistaUsada}
          onFechar={() => {
            setMostrarContrato(false)
            onContratosChange(getContratosAtivos().length)
          }}
          onProximoDesafio={onProximoDesafio ? () => {
            setMostrarContrato(false)
            onContratosChange(getContratosAtivos().length)
            onProximoDesafio()
          } : undefined}
          onBonusResolvido={(bonus) => {
            // Bônus da trivia de lendas → aplica imediatamente ao perfil
            const perfilAtualizado = aplicarBonusContrato(bonus)
            if (perfilAtualizado) onResultado(perfilAtualizado)
          }}
        />
      )}

      {/* Tela de resultado — suprimida se TelaFinalDia estiver aberta no pai */}
      {mostrarResultado && !mostrarContrato && !telaFinalAberta && (
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

      {/* ── Barra de input fixa no rodapé ─────────────────────────────
          Sempre visível na tela, sem precisar rolar.
          O env(safe-area-inset-bottom) cobre o indicador home do iPhone. */}
      {estado.status === 'jogando' && inputMontado && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 border-t border-zinc-800 px-4 pt-2"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          <div className="max-w-md mx-auto">
            {/* Lembrete de pontos — sempre visível mesmo com scroll */}
            <div className="text-center mb-2">
              {introEmDestaque ? (
                <p className="text-xs text-green-400 font-semibold">
                  ✨ Adivinhe pelo histórico · Vale <span className="text-yellow-400">100 pts</span>
                </p>
              ) : (
                <p className="text-xs text-zinc-400">
                  Pista <span className="text-green-400 font-bold">{estado.pistaAtual}</span> de {TOTAL_PISTAS} · Vale <span className="text-yellow-400 font-bold">{PONTOS_BASE[estado.pistaAtual]} pts</span>
                </p>
              )}
            </div>
            <InputPalpite
              onPalpite={handlePalpite}
              desabilitado={false}
              tentativasAnteriores={estado.tentativas.map(t => t.nome)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
