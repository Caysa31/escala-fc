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
import { getModeAtual, GameMode } from '@/lib/gameMode'

import Pista from './Pista'
import InputPalpite from './InputPalpite'
import ListaTentativas from './ListaTentativas'
import TelaResultado from './TelaResultado'
import { ModalContrato } from './TelaContrato'

// Cor do modo para passar às pistas
const MODE_COLOR: Record<string, string> = {
  bola: '#00C853',
  copa: '#FFD23F',
}

// Confetti CSS — cria partículas que caem e remove automaticamente
function dispararConfetti() {
  const colors = ['#FFD23F', '#00C853', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa']
  const container = document.body
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div')
    el.className = 'confetti-piece'
    el.style.left = `${Math.random() * 100}vw`
    el.style.background = colors[Math.floor(Math.random() * colors.length)]
    el.style.animationDuration = `${0.8 + Math.random() * 1.2}s`
    el.style.animationDelay = `${Math.random() * 0.4}s`
    el.style.width = `${6 + Math.random() * 6}px`
    el.style.height = `${6 + Math.random() * 6}px`
    container.appendChild(el)
    setTimeout(() => el.remove(), 2500)
  }
}

// Vibração háptica — silenciosamente ignora se API não disponível
function vibrar(padrao: number | number[]) {
  try { navigator.vibrate?.(padrao) } catch { /* silencioso */ }
}

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
  mode?: GameMode             // override do getModeAtual() — necessário nos modos extras de copa
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
  mode: modeProp,
}: Props) {
  // Total de pistas dinâmico (Relâmpago sobrescreve TOTAL_PISTAS)
  const totalPistas = totalPistasMax ?? TOTAL_PISTAS

  // Multiplicador de treino — ativo apenas no desafio diário (não em modos extras)
  const multiplicador = modoExtra ? 1 : getMultiplicadorTreino()
  const mode = modeProp ?? getModeAtual()
  const pistasTexto = getPistasTexto(jogador, mode)
  const introNarrativa = getIntroNarrativa(jogador, mode)

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

  const modeColor = MODE_COLOR[mode] ?? '#00C853'

  const [estado, setEstado] = useState<EstadoJogo>({
    pistaAtual: 0,
    tentativas: [],
    status: 'jogando',
    pistaUsada: null,
  })
  const [mostrarContrato, setMostrarContrato] = useState(false)
  const [mostrarResultado, setMostrarResultado] = useState(false)
  const [inputMontado, setInputMontado] = useState(false)
  const [shakePistas, setShakePistas] = useState(false)
  const currentPistaRef = useRef<HTMLDivElement>(null)
  const [keyboardH, setKeyboardH] = useState(0)

  // Detecta altura do teclado via visualViewport e armazena em React state.
  // Usar state (não translateY no DOM) evita que re-renders do React anulem
  // o estilo aplicado diretamente. Fórmula sem vv.pageTop: pageTop varia com
  // scroll da página e causaria offset menor que o teclado real.
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => setKeyboardH(Math.max(0, window.innerHeight - vv.height))
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])

  // Quando o teclado abre, rola para manter a pista atual visível acima da barra.
  function handleInputFocused() {
    setTimeout(() => {
      const pista = currentPistaRef.current
      if (!pista) return
      let top = 0
      let el: HTMLElement | null = pista
      while (el) { top += el.offsetTop; el = el.offsetParent as HTMLElement | null }
      window.scrollTo({ top: Math.max(0, top - 12), behavior: 'smooth' })
    }, 350)
  }

  // Auto-scroll quando uma nova pista é revelada: mostra a pista atual no topo
  // para que a próxima (bloqueada) fique visível abaixo.
  useEffect(() => {
    if (estado.pistaAtual === 0) return
    setTimeout(() => {
      currentPistaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 250)
  }, [estado.pistaAtual]) // eslint-disable-line react-hooks/exhaustive-deps

  // Quando TelaFinalDia fecha (telaFinalAberta: true→false), fecha TelaResultado
  const prevTelaFinalAberta = useRef(false)
  useEffect(() => {
    if (prevTelaFinalAberta.current && !telaFinalAberta) {
      setMostrarResultado(false)
    }
    prevTelaFinalAberta.current = telaFinalAberta ?? false
  }, [telaFinalAberta])

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
    setEstado(prev => ({ ...prev, status: 'perdeu' }))
    setMostrarResultado(true)
  }

  function handlePalpite(nome: string) {
    if (estado.status !== 'jogando') return

    const acertou = verificarPalpite(nome, jogador)
    const novaTentativa: Tentativa = { nome, status: acertou ? 'acerto' : 'erro' }
    const novasTentativas = [...estado.tentativas, novaTentativa]

    const pistaEfetiva = estado.pistaAtual

    if (acertou) {
      vibrar(300)
      dispararConfetti()
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
      vibrar([60, 40, 60])
      setShakePistas(true)
      setTimeout(() => setShakePistas(false), 400)

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


      {/* Intro em destaque — só quando ainda não revelou nenhuma pista */}
      {/* Banner removido — info já aparece na barra de baixo */}

      {estado.status === 'ganhou' && (
        <div className="rounded-2xl px-5 py-5 text-center space-y-3 animate-pop" style={{ background: `${modeColor}0C`, border: `1px solid ${modeColor}40`, boxShadow: `0 0 24px ${modeColor}18` }}>
          <div>
            <p className="font-bold text-base" style={{ color: `${modeColor}CC` }}>
              🎯 {estado.pistaUsada === 0 ? 'Acertou pelo histórico!' : `Acertou na pista ${estado.pistaUsada}!`}
            </p>
            <p className="text-[#FFD23F] font-black text-4xl mt-1">+{pontosRodada} <span className="text-xl">pts</span></p>
            {!modoExtra && multiplicador > 1 && (
              <p className="text-[#8AB4CC] text-xs font-semibold mt-1">🏋️ Bônus de treino ×{multiplicador} ativado!</p>
            )}
          </div>
          {/* Card com dados do jogador */}
          <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-left" style={{ background: '#0A1220', border: `1px solid ${modeColor}25` }}>
            <span className="text-3xl flex-shrink-0">{jogador.bandeira}</span>
            <div className="min-w-0">
              <p className="font-black text-white text-base leading-tight truncate">{jogador.apelido ?? jogador.nome}</p>
              <p className="text-[#8AB4CC] text-xs mt-0.5">{jogador.posicao} · {jogador.clube}</p>
            </div>
          </div>
          {onProximoDesafio ? (
            <div className="space-y-2">
              {!modoExtra && <p className="text-[#5A8AAA] text-sm">Você ainda pode aumentar sua pontuação!</p>}
              <button onClick={onProximoDesafio} className="w-full font-bold py-3 rounded-xl text-sm transition-all text-[#0A1626]" style={{ background: modeColor }}>
                {labelProximoDesafio}
              </button>
              {!modoExtra && <button onClick={() => setMostrarResultado(true)} className="text-[#5A8AAA] text-xs underline">Ver detalhes</button>}
            </div>
          ) : (
            <p className="text-[#5A8AAA] text-xs animate-pulse">{mensagemFimJogo}</p>
          )}
        </div>
      )}

      {estado.status === 'perdeu' && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-2xl px-5 py-5 text-center space-y-3">
          <p className="text-red-400 text-sm font-semibold">Não foi dessa vez...</p>
          {/* Card com dados do jogador */}
          <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-left" style={{ background: '#0A1220', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span className="text-3xl flex-shrink-0">{jogador.bandeira}</span>
            <div className="min-w-0">
              <p className="font-black text-white text-base leading-tight truncate">{jogador.apelido ?? jogador.nome}</p>
              <p className="text-[#8AB4CC] text-xs mt-0.5">{jogador.posicao} · {jogador.clube}</p>
            </div>
          </div>
          {onProximoDesafio ? (
            <div className="space-y-2">
              <button onClick={onProximoDesafio} className="w-full bg-[#0A1220] border border-[#1A2A40] text-white font-bold py-3 rounded-xl text-sm transition-all">{labelProximoDesafio}</button>
              {!modoExtra && <button onClick={() => setMostrarResultado(true)} className="text-[#5A8AAA] text-xs underline">Ver detalhes</button>}
            </div>
          ) : (
            <button onClick={() => setMostrarResultado(true)} className="text-red-400 text-xs underline">Ver resultado</button>
          )}
        </div>
      )}

      {/* Intro narrativa */}
      <div className="card-glass rounded-xl px-4 py-3" style={{ background: 'rgba(8,13,24,0.75)', border: '1px solid rgba(26,42,64,0.8)' }}>
        <p className="text-[10px] uppercase font-black tracking-widest mb-1.5" style={{ color: `${modeColor}80` }}>
          ⚡ Jogador do dia
        </p>
        <p className="leading-snug italic text-[#8AB4CC] text-sm">
          &ldquo;{introNarrativa}&rdquo;
        </p>
      </div>

      {/* Barra de progresso visual das pistas */}
      {estado.status === 'jogando' && (
        <div className="flex items-center gap-1 px-1">
          {Array.from({ length: totalPistas }, (_, i) => i + 1).map(num => {
            const revelada = num <= estado.pistaAtual
            const atual = num === estado.pistaAtual
            const errou = revelada && num < estado.pistaAtual
            return (
              <div key={num} className="flex items-center gap-1 flex-1">
                <div
                  className="flex-1 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    background: errou ? '#ef4444' : atual ? modeColor : revelada ? `${modeColor}60` : '#1A2A40',
                    boxShadow: atual ? `0 0 8px ${modeColor}80` : 'none',
                  }}
                />
                {num < totalPistas && <div className="w-0.5 h-0.5 rounded-full bg-[#1A2A40]" />}
              </div>
            )
          })}
          <span className="text-[10px] font-black ml-2 flex-shrink-0" style={{ color: `${modeColor}80` }}>
            {estado.pistaAtual === 0 ? 'início' : `${estado.pistaAtual}/${totalPistas}`}
          </span>
        </div>
      )}

      {/* Pistas */}
      <div className={`space-y-2 ${shakePistas ? 'animate-shake' : ''}`}>
        {Array.from({ length: totalPistas }, (_, i) => i + 1).map(num => {
          const revelada = num <= estado.pistaAtual
          const atual = num === estado.pistaAtual && estado.status === 'jogando'
          const errou = revelada && (num < estado.pistaAtual || estado.status === 'perdeu')
          const correto = estado.status === 'ganhou' && num === estado.pistaUsada
          const onRevelar = estado.pistaAtual === 0 && num === 1 && estado.status === 'jogando'
            ? () => setEstado(e => ({ ...e, pistaAtual: 1 }))
            : undefined
          const onDestravar = estado.status === 'jogando' &&
            estado.pistaAtual >= 1 &&
            num === estado.pistaAtual + 1 &&
            !onRevelar
            ? handleDestravar
            : undefined
          const ptsDestaPista = Math.round((PONTOS_BASE[num] ?? 20) * multiplicador)
          const custoEsta = Math.round(((PONTOS_BASE[num - 1] ?? 100) - (PONTOS_BASE[num] ?? 20)) * multiplicador)

          return (
            <div key={num} ref={num === (estado.pistaAtual === 0 ? 1 : estado.pistaAtual) ? currentPistaRef : undefined}>
              <Pista
                numero={num}
                texto={pistasTexto[num] ?? ''}
                revelada={revelada}
                atual={atual}
                errou={errou}
                correto={correto}
                subtitulo={num === 2 ? subtituloPista2 : (mode === 'copa' && num === 4) ? 'Time + Nome' : undefined}
                renderAs={mode === 'copa' && num === 4 ? 5 : undefined}
                onRevelar={onRevelar}
                onDestravar={onDestravar}
                pontosAtual={atual && estado.status === 'jogando' ? ptsDestaPista : undefined}
                custoDestravar={onDestravar && custoEsta > 0 ? custoEsta : undefined}
                modeColor={modeColor}
              />
            </div>
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
          className="input-glass fixed left-0 right-0 z-50 px-4 pt-3"
          style={{
            background: 'rgba(5, 8, 18, 0.88)',
            borderTop: `1px solid ${modeColor}20`,
            backdropFilter: 'blur(12px)',
            bottom: keyboardH > 50
              ? `${keyboardH}px`
              : temBottomNav ? 'calc(56px + env(safe-area-inset-bottom))' : '0',
            paddingBottom: keyboardH > 50 ? '8px' : temBottomNav ? '8px' : 'max(12px, env(safe-area-inset-bottom))',
          }}
        >
          <div className="max-w-md mx-auto">
            {/* Placar arcade */}
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: `${modeColor}70` }}>
                {introEmDestaque ? 'Adivinhe pelo histórico' : `Pista ${estado.pistaAtual} / ${totalPistas}`}
              </p>
              <div className={`flex items-baseline gap-1 transition-transform duration-300 ${flashPts ? 'animate-pts-drop' : ''}`}>
                {multiplicador > 1 && (
                  <>
                    <span className="text-[#5A8AAA] text-xs line-through">{pontosBrutosDisplay}</span>
                    <span className="text-orange-400 text-xs font-black">×{multiplicador}</span>
                  </>
                )}
                <span className="text-3xl font-black leading-none tabular-nums" style={{ color: pontosDisplay >= Math.round(40 * multiplicador) ? modeColor : '#ef4444' }}>
                  {pontosDisplay}
                </span>
                <span className="text-xs font-bold" style={{ color: `${modeColor}80` }}>pts</span>
              </div>
            </div>
            {/* Opção de pular — acima do input para ficar visível mesmo com teclado aberto */}
            {estado.pistaAtual >= 1 && (
              <div className="mb-2">
                <button
                  type="button"
                  onClick={handlePularDesafio}
                  className="w-full text-center text-[#8AB4CC] text-xs font-medium py-1 transition-colors hover:text-white"
                >
                  🏳️ Não sei esse jogador — passar
                </button>
              </div>
            )}

            <InputPalpite
              onPalpite={handlePalpite}
              desabilitado={false}
              tentativasAnteriores={estado.tentativas.map(t => t.nome)}
              mode={mode}
              onFocused={handleInputFocused}
            />
          </div>
        </div>
      )}
    </div>
  )
}
