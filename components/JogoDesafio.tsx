'use client'

import { useState, useEffect, useRef } from 'react'
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
import { getMultiplicadorTreino } from '@/lib/modos'

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
  // ── Modo Extra ────────────────────────────────────────────────
  modoExtra?: boolean         // true: não afeta streak/stats, não abre ModalContrato
  totalPistasMax?: number     // override de TOTAL_PISTAS (Relâmpago = 3)
  labelProximoDesafio?: string // label do botão de próximo (padrão: "Próximo desafio →")
  mensagemFimJogo?: string    // texto quando não há próximo desafio (padrão: "Calculando...")
  onFimJogo?: (resultado: { ganhou: boolean; pontos: number; pistaAcerto: number | null }) => void
}

export default function JogoDesafio({
  jogador, rodadaId, perfil, indiceDesafio, mensagemMotivacional,
  telaFinalAberta,
  onResultado, onContratosChange, onProximoDesafio,
  modoExtra = false,
  totalPistasMax,
  labelProximoDesafio = 'Próximo desafio →',
  mensagemFimJogo = 'Calculando resultado do dia...',
  onFimJogo,
}: Props) {
  // Total de pistas dinâmico (Relâmpago sobrescreve TOTAL_PISTAS)
  const totalPistas = totalPistasMax ?? TOTAL_PISTAS

  // Multiplicador de treino — ativo apenas no desafio diário (não em modos extras)
  const multiplicador = modoExtra ? 1 : getMultiplicadorTreino()
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
      const pontosBrutos = calcularPontos(pistaEfetiva)
      // Aplica multiplicador de treino apenas no desafio diário
      const pontos = Math.round(pontosBrutos * multiplicador)
      const novoEstado: EstadoJogo = {
        ...estado,
        tentativas: novasTentativas,
        status: 'ganhou',
        pistaUsada: pistaEfetiva,
      }
      setEstado(novoEstado)

      if (perfil) {
        if (modoExtra) {
          // Modo Extra: só adiciona pontos, sem streak/stats
          const perfilAtualizado = aplicarBonusContrato(pontos) ?? perfil
          onResultado(perfilAtualizado)
        } else {
          const perfilAtualizado = registrarResultado(perfil, {
            rodadaId,
            jogadorId: jogador.id,
            pistaAcerto: pistaEfetiva,
            pontos,
            tentativas: novasTentativas,
          })
          onResultado(perfilAtualizado)
        }
      }

      onFimJogo?.({ ganhou: true, pontos, pistaAcerto: pistaEfetiva })
      if (!modoExtra) setMostrarContrato(true)
    } else {
      const novaPista = estado.pistaAtual + 1
      const acabou = novaPista > totalPistas

      const novoEstado: EstadoJogo = {
        ...estado,
        tentativas: novasTentativas,
        pistaAtual: acabou ? totalPistas : novaPista,
        status: acabou ? 'perdeu' : 'jogando',
        pistaUsada: null,
      }
      setEstado(novoEstado)

      if (acabou) {
        if (!modoExtra && perfil) {
          // Modo normal: salva resultado no perfil
          const perfilAtualizado = registrarResultado(perfil, {
            rodadaId,
            jogadorId: jogador.id,
            pistaAcerto: null,
            pontos: 0,
            tentativas: novasTentativas,
          })
          onResultado(perfilAtualizado)
        }
        onFimJogo?.({ ganhou: false, pontos: 0, pistaAcerto: null })
        // Sempre abre TelaResultado na derrota — igual à vitória que abre ModalContrato
        // Para o último desafio, TelaFinalDia aparece por cima via useEffect do pai
        setMostrarResultado(true)
      }
    }
  }

  const pontosRodada = estado.pistaUsada ? Math.round(calcularPontos(estado.pistaUsada) * multiplicador) : 0

  // Intro narrativa em destaque quando ainda não há pistas reveladas (qualquer desafio, estado inicial)
  const introEmDestaque = estado.pistaAtual === 0 && estado.status === 'jogando'

  // ── Placar dinâmico ──────────────────────────────────────────
  // Pontos que o jogador vai ganhar SE acertar agora (baseado na pista atual)
  // pistaAtual=0 → ainda não revelou → vale 100 (pista 1)
  const pistaValor = estado.pistaAtual === 0 ? 1 : estado.pistaAtual
  const pontosBrutosDisplay = PONTOS_BASE[pistaValor] ?? 20
  const pontosDisplay = Math.round(pontosBrutosDisplay * multiplicador)

  // Cor muda conforme os pontos caem (cria urgência visual)
  const corPts = (() => {
    if (pontosDisplay >= Math.round(100 * multiplicador)) return 'text-yellow-400'
    if (pontosDisplay >= Math.round(60 * multiplicador))  return 'text-green-400'
    if (pontosDisplay >= Math.round(40 * multiplicador))  return 'text-orange-400'
    return 'text-red-400'
  })()

  // Flash animation quando os pontos caem (nova pista revelada)
  const [flashPts, setFlashPts] = useState(false)
  const prevPistaRef = useRef(estado.pistaAtual)
  useEffect(() => {
    if (estado.pistaAtual !== prevPistaRef.current && estado.pistaAtual > 0) {
      prevPistaRef.current = estado.pistaAtual
      setFlashPts(true)
      const t = setTimeout(() => setFlashPts(false), 500)
      return () => clearTimeout(t)
    }
  }, [estado.pistaAtual])

  return (
    <div className="space-y-4">

      {/* Banner motivacional (desafio anterior foi perdido) */}
      {mensagemMotivacional && (
        <div className="bg-blue-950 border border-blue-800 rounded-xl px-4 py-3 text-center">
          <p className="text-blue-300 text-sm font-semibold">{mensagemMotivacional}</p>
        </div>
      )}

      {/* Intro em destaque — só quando ainda não revelou nenhuma pista */}
      {introEmDestaque && (
        <div className="bg-green-950 border border-green-800 rounded-xl px-4 py-3 text-center">
          <p className="text-sm text-green-300">
            ✨ Adivinhe pelo histórico — Vale{' '}
            <span className="text-yellow-400 font-bold">100 pts</span>
          </p>
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
            {!modoExtra && multiplicador > 1 && (
              <p className="text-orange-400 text-xs font-semibold mt-1">
                🏋️ Bônus de treino ×{multiplicador} ativado!
              </p>
            )}
          </div>

          {onProximoDesafio ? (
            /* Tem próximo desafio ou "Jogar Novamente" no modo extra */
            <div className="space-y-2">
              {!modoExtra && (
                <p className="text-zinc-300 text-sm">
                  Você ainda pode aumentar sua pontuação!
                </p>
              )}
              <button
                onClick={onProximoDesafio}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-sm transition-all"
              >
                {labelProximoDesafio}
              </button>
              {!modoExtra && (
                <button
                  onClick={() => setMostrarResultado(true)}
                  className="text-zinc-500 text-xs underline"
                >
                  Ver detalhes
                </button>
              )}
            </div>
          ) : (
            /* Último desafio ou modo extra sem mais plays */
            <p className="text-zinc-400 text-xs animate-pulse">
              {mensagemFimJogo}
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
                {labelProximoDesafio}
              </button>
              {!modoExtra && (
                <button
                  onClick={() => setMostrarResultado(true)}
                  className="text-zinc-500 text-xs underline"
                >
                  Ver detalhes
                </button>
              )}
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
        {Array.from({ length: totalPistas }, (_, i) => i + 1).map(num => {
          const revelada = num <= estado.pistaAtual
          const atual = num === estado.pistaAtual && estado.status === 'jogando'
          // Pista ficou vermelha se foi revelada, não é a atual e não é a pista de acerto
          const errou = revelada && (num < estado.pistaAtual || estado.status === 'perdeu')
          // Pista fica verde permanente se foi onde o jogador acertou
          const correto = estado.status === 'ganhou' && num === estado.pistaUsada
          // Pista 1 é clicável para revelar em todos os desafios quando ainda não há pistas abertas
          const onRevelar = estado.pistaAtual === 0 && num === 1 && estado.status === 'jogando'
            ? () => setEstado(e => ({ ...e, pistaAtual: 1 }))
            : undefined
          // Botão "Ver próxima dica" aparece apenas na pista seguinte à atual (quando em jogo)
          const onDestravar = estado.status === 'jogando' &&
            estado.pistaAtual >= 1 &&
            num === estado.pistaAtual + 1 &&
            !onRevelar
            ? handleDestravar
            : undefined
          // Valor atual: pontos que o jogador ganha se acertar AGORA (antes de ver mais pistas)
          // Aparece na próxima pista bloqueada, não na revelada
          const ptsAtivos = Math.round((PONTOS_BASE[estado.pistaAtual] ?? 100) * multiplicador)
          // Custo de revelar esta pista específica (quanto cai ao desbloqueá-la)
          const custoEsta = Math.round(
            ((PONTOS_BASE[num - 1] ?? 100) - (PONTOS_BASE[num] ?? 20)) * multiplicador
          )

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
              // "Agora vale X pts" aparece na pista BLOQUEADA com botão de destravar
              pontosAtual={onDestravar ? ptsAtivos : undefined}
              custoDestravar={onDestravar && custoEsta > 0 ? custoEsta : undefined}
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
            {/* Placar sempre visível — grande, colorido, com flash ao cair */}
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-zinc-500 text-xs">
                {introEmDestaque
                  ? 'Adivinhe pelo histórico'
                  : `Pista ${estado.pistaAtual} de ${totalPistas}`}
              </p>
              <div
                className={`flex items-baseline gap-1 transition-transform duration-300 ${
                  flashPts ? 'scale-125' : 'scale-100'
                }`}
              >
                {multiplicador > 1 && (
                  <>
                    <span className="text-zinc-500 text-xs line-through">{pontosBrutosDisplay}</span>
                    <span className="text-orange-400 text-xs font-bold">×{multiplicador}</span>
                  </>
                )}
                <span className={`text-2xl font-black leading-none transition-colors duration-300 ${corPts}`}>
                  {pontosDisplay}
                </span>
                <span className="text-zinc-400 text-sm font-semibold">pts</span>
              </div>
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
