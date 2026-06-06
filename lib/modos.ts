// Puzzles Ilimitados Temáticos — Copa do Mundo 2026

import jogadoresData from '@/data/jogadores.json'
import { Jogador } from './types'

const jogadores = jogadoresData as Jogador[]

export type ModoId = 'lenda' | 'jovens' | 'relampago'

export interface ModoConfig {
  id: ModoId | 'cobra-sabe'
  label: string
  emoji: string
  descricao: string
  corFundo: string
  corBorda: string
  corTexto: string
  totalPistas?: number
  href?: string  // URL customizada (ex: modo trivia)
}

export const MODOS_CONFIG: ModoConfig[] = [
  {
    id: 'lenda',
    label: 'Modo Lenda da Copa',
    emoji: '🏆',
    descricao: 'Os maiores craques da Copa 2026. Você os conhece todos?',
    corFundo: 'bg-[#0F1D30]',
    corBorda: 'border-[#2A5275]',
    corTexto: 'text-[#FFD23F]',
  },
  {
    id: 'jovens',
    label: 'Modo Jovens da Copa',
    emoji: '⚡',
    descricao: 'A nova geração em campo. Os craques de amanhã jogando hoje.',
    corFundo: 'bg-[#0F1D30]',
    corBorda: 'border-[#2A5275]',
    corTexto: 'text-[#8AB4CC]',
  },
  {
    id: 'relampago',
    label: 'Modo Relâmpago',
    emoji: '🔥',
    descricao: 'Só 3 pistas. Copa é assim: ou você sabe, ou não sabe.',
    corFundo: 'bg-[#0F1D30]',
    corBorda: 'border-[#2A5275]',
    corTexto: 'text-red-400',
    totalPistas: 3,
  },
  {
    id: 'cobra-sabe',
    label: 'Só Cobra Sabe',
    emoji: '🐍',
    descricao: 'Fatos históricos da Copa do Mundo. Só quem é cobra de verdade sabe!',
    corFundo: 'bg-[#0F1D30]',
    corBorda: 'border-[#2A5275]',
    corTexto: 'text-[#00C853]',
    href: '/modos/cobra-sabe',
  },
]

// ── Pools por modo ────────────────────────────────────────────
// Lenda:     dificuldade 'facil' = craques mundialmente famosos
// Jovens:    faixaEtaria '18-22' ou '22-26' (jovens da Copa)
// Relâmpago: todos os jogadores da Copa

const JOVENS_FA = new Set(['17-21', '18-22', '19-23', '20-24', '21-25', '22-26', 'jovem', 'jovem adulto'])

const POOLS: Record<ModoId, Jogador[]> = {
  lenda:     jogadores.filter(j => j.dificuldade === 'facil'),
  jovens:    jogadores.filter(j => JOVENS_FA.has(j.faixaEtaria ?? '')),
  relampago: jogadores,
}

export function getModoConfig(id: string): ModoConfig | undefined {
  return MODOS_CONFIG.find(m => m.id === id)
}

/** Jogador aleatório do pool, evitando IDs já jogados hoje */
export function getJogadorAleatorio(modoId: ModoId, excluirIds: number[] = []): Jogador {
  const pool = POOLS[modoId]
  const disponiveis = pool.filter(j => !excluirIds.includes(j.id))
  const lista = disponiveis.length > 0 ? disponiveis : pool  // fallback se todos foram jogados
  return lista[Math.floor(Math.random() * lista.length)]
}

// ── Controle de plays por dia ─────────────────────────────────

/** Máximo de partidas extras por modo por dia */
export const MAX_PLAYS_POR_DIA = 10

function hoje(): string {
  return new Date().toISOString().split('T')[0]
}

function playCountKey(modoId: string): string {
  return `escalafc_modo_plays_${modoId}_${hoje()}`
}

function playedIdsKey(modoId: string): string {
  return `escalafc_modo_ids_${modoId}_${hoje()}`
}

export function getModoPlaysHoje(modoId: string): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(playCountKey(modoId)) ?? '0', 10)
}

export function incrementarModoPlays(modoId: string): void {
  if (typeof window === 'undefined') return
  const atual = getModoPlaysHoje(modoId)
  localStorage.setItem(playCountKey(modoId), String(atual + 1))
}

export function getModoPlayedIdsHoje(modoId: string): number[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(playedIdsKey(modoId)) ?? '[]') as number[]
  } catch { return [] }
}

export function registrarModoJogadorId(modoId: string, jogadorId: number): void {
  if (typeof window === 'undefined') return
  const ids = getModoPlayedIdsHoje(modoId)
  if (!ids.includes(jogadorId)) {
    localStorage.setItem(playedIdsKey(modoId), JSON.stringify([...ids, jogadorId]))
  }
}

// ── Multiplicador de treino ───────────────────────────────────
// Cada jogo nos modos extras carrega um bônus para o desafio diário do dia seguinte.
// Tiers: 1–4 jogos → ×1.2 | 5–9 jogos → ×1.35 | 10+ jogos → ×1.5

const TREINO_KEY = 'escalafc_treino'

interface TreinoData {
  data: string
  jogos: number
}

function getTreinoData(dataAlvo: string): TreinoData {
  if (typeof window === 'undefined') return { data: dataAlvo, jogos: 0 }
  try {
    const raw = localStorage.getItem(TREINO_KEY)
    if (!raw) return { data: dataAlvo, jogos: 0 }
    const parsed = JSON.parse(raw) as TreinoData
    return parsed.data === dataAlvo ? parsed : { data: dataAlvo, jogos: 0 }
  } catch { return { data: dataAlvo, jogos: 0 } }
}

function tiersMultiplicador(jogos: number): number {
  if (jogos >= 10) return 1.5
  if (jogos >= 5) return 1.35
  if (jogos >= 1) return 1.2
  return 1
}

/** Registra uma partida de modo extra como "treino" para o bônus de amanhã */
export function registrarTreinoHoje(): void {
  if (typeof window === 'undefined') return
  const dataHoje = hoje()
  const treino = getTreinoData(dataHoje)
  treino.jogos++
  localStorage.setItem(TREINO_KEY, JSON.stringify(treino))
}

/** Quantos jogos de treino foram feitos hoje */
export function getTreinoJogosHoje(): number {
  return getTreinoData(hoje()).jogos
}

/** Preview do multiplicador que o treino de hoje vai gerar amanhã */
export function getBonusAmanha(): number {
  return tiersMultiplicador(getTreinoJogosHoje())
}

/**
 * Multiplicador ativo AGORA no desafio diário (baseado no treino de ontem).
 * Retorna 1 se não treinou ontem.
 */
export function getMultiplicadorTreino(): number {
  if (typeof window === 'undefined') return 1
  const ontemStr = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]
  return tiersMultiplicador(getTreinoData(ontemStr).jogos)
}
