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
  temBottomNav?: boolean      // true: empurra barra de input acima do BottomNav
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
  temBottomNav = false,
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

  // Pula o desafio inteiro — registra como perdeu, 0 pts, vai pro próximo sem mostrar resultado
  function handlePularDesafio() {
    if (estado.status !== 'jogando') return
    if (!modoExtra && perfil) {
      const perfilAtualizado = registrarResultado(perfil, {
        rodadaId,
        jogadorId: jogador.id,
        pistaAcerto: null,
        pontos: 0,
        tentativas: estado.tentativas,
      })
      onResultado(perfilAtualizado)
    }
    onFimJogo?.({ ganhou: false, pontos: 0, pistaAcerto: null })
    if (onProximoDesafio) {
      onProximoDesafio()
    } else {
      setMostrarResultado(true)
    }
  }

  function handlePalpite(nome: string) {
    if (estado.status !== 'jogando') return

    const acertou = verificarPalpite(nome, jogador)
    const novaTentativa: Tentativa = { nome, status: acertou ? 'acerto' : 'erro' }
    const novasTentativas = [...estado.tentativas, novaTentativa]

    // pistaAtual=0 = acertou pelo histórico (120 pts), 1-5 = pistas normais
    const pistaEfetiva = estado.pistaAtual

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

  // IMPORTANTE: pistaUsada pode ser 0 (histórico) — usar !== null, nunca truthy check
  const pontosRodada = estado.pistaUsada !== null ? Math.round(calcularPontos(estado.pistaUsada) * multiplicador) : 0

  // Intro narrativa em destaque quando ainda não há pistas reveladas (qualquer desafio, estado inicial)
  const introEmDestaque = estado.pistaAtual === 0 && estado.status === 'jogando'

  // ── Placar dinâmico ──────────────────────────────────────────
  // Pontos que o jogador vai ganhar SE acertar agora
  // pistaAtual=0 → histórico vale 120, pista 1 em diante segue PONTOS_BASE
  const pistaValor = estado.pistaAtual  // 0 = histórico, 1-5 = pistas
  const pontosBrutosDisplay = PONTOS_BASE[pistaValor] ?? 20
  const pontosDisplay = Math.round(pontosBrutosDisplay * multiplicador)

  // Cor muda conforme os pontos caem (cria urgência visual) — sempre dourado até cair para vermelho
  const corPts = (() => {
    if (pontosDisplay >= Math.round(40 * multiplicador)) return 'text-[#FFD23F]'
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
        <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl px-4 py-3 text-center">
          <p className="text-[#8AB4CC] text-sm font-semibold">{mensagemMotivacional}</p>
        </div>
      )}

      {/* Intro em destaque — só quando ainda não revelou nenhuma pista */}
      {/* Banner removido — info já aparece na barra de baixo */}

      {estado.status === 'ganhou' && (
        <div className="bg-[#071A0F] border border-[#00C853]/30 rounded-2xl px-5 py-5 text-center space-y-3">
          <div>
            <p className="text-[#4A9A6A] font-bold text-base">
              🎯 {estado.pistaUsada === 0 ? 'Acertou pelo histórico!' : `Acertou na pista ${estado.pistaUsada}!`}
            </p>
            <p className="text-[#FFD23F] font-black text-3xl mt-1">+{pontosRodada} pts</p>
            {!modoExtra && multiplicador > 1 && (
              <p className="text-[#8AB4CC] text-xs font-semibold mt-1">
                🏋️ Bônus de treino ×{multiplicador} ativado!
              </p>
            )}
          </div>

          {onProximoDesafio ? (
            /* Tem próximo desafio ou "Jogar Novamente" no modo extra */
            <div className="space-y-2">
              {!modoExtra && (
                <p className="text-[#8AB4CC] text-sm">
                  Você ainda pode aumentar sua pontuação!
                </p>
              )}
              <button
                onClick={onProximoDesafio}
                className="w-full bg-[#00C853] hover:bg-[#00E060] text-[#0A1626] font-bold py-3 rounded-xl text-sm transition-all"
              >
                {labelProximoDesafio}
              </button>
              {!modoExtra && (
                <button
                  onClick={() => setMostrarResultado(true)}
                  className="text-[#5A8AAA] text-xs underline"
                >
                  Ver detalhes
                </button>
              )}
            </div>
          ) : (
            /* Último desafio ou modo extra sem mais plays */
            <p className="text-[#5A8AAA] text-xs animate-pulse">
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
                className="w-full bg-[#0F1D30] border border-[#1A3A5C] text-white font-bold py-3 rounded-xl text-sm transition-all"
              >
                {labelProximoDesafio}
              </button>
              {!modoExtra && (
                <button
                  onClick={() => setMostrarResultado(true)}
                  className="text-[#5A8AAA] text-xs underline"
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

      {/* Intro narrativa — compacta para pista 1 aparecer no fold */}
      <div className="bg-[#0F1D30] border border-[#2A5275] rounded-xl px-4 py-3">
        <p className="text-xs uppercase font-bold tracking-widest mb-2 text-[#8AB4CC]">
          ⚡ Jogador do dia
        </p>
        <p className="leading-snug italic text-white text-sm">
          &ldquo;{introNarrativa}&rdquo;
        </p>
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
          // Valor desta pista — mostrado dentro do card após ser revelada (pista ativa)
          const ptsDestaPista = Math.round((PONTOS_BASE[num] ?? 20) * multiplicador)
          // Custo de revelar a PRÓXIMA — mostrado no botão da pista bloqueada
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
              // "Agora vale X pts" → só na pista ATIVA (recém-revelada)
              pontosAtual={atual && estado.status === 'jogando' ? ptsDestaPista : undefined}
              // "−X pts se revelar" → só na pista BLOQUEADA com botão
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
      {mostrarContrato && estado.pistaUsada !== null && (
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
          className="fixed left-0 right-0 z-50 bg-[#070E1A] border-t border-[#2A5275] px-4 pt-3"
          style={{
            bottom: temBottomNav ? 'calc(56px + env(safe-area-inset-bottom))' : '0',
            paddingBottom: temBottomNav ? '8px' : 'max(12px, env(safe-area-inset-bottom))',
          }}
        >
          <div className="max-w-md mx-auto">
            {/* Placar sempre visível */}
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-[#8AB4CC] text-xs">
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
                    <span className="text-[#8AB4CC] text-xs line-through">{pontosBrutosDisplay}</span>
                    <span className="text-orange-400 text-xs font-bold">×{multiplicador}</span>
                  </>
                )}
                <span className={`text-2xl font-black leading-none transition-colors duration-300 ${corPts}`}>
                  {pontosDisplay}
                </span>
                <span className="text-[#8AB4CC] text-sm font-semibold">pts</span>
              </div>
            </div>
            <InputPalpite
              onPalpite={handlePalpite}
              desabilitado={false}
              tentativasAnteriores={estado.tentativas.map(t => t.nome)}
            />

            {/* Opção de pular — só aparece após revelar pelo menos 1 pista */}
            {estado.pistaAtual >= 1 && (
              <div className="border-t border-[#1A3A5C] mt-1 pt-2">
                <button
                  type="button"
                  onClick={handlePularDesafio}
                  className="w-full text-center text-white text-xs font-medium py-1 transition-colors opacity-70 hover:opacity-100"
                >
                  🏳️ Não sei esse jogador — passar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
