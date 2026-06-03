// Puzzles Ilimitados Temáticos — definições e helpers

import jogadoresData from '@/data/jogadores.json'
import { Jogador } from './types'

const jogadores = jogadoresData as Jogador[]

export type ModoId = 'lenda' | 'brasileirao' | 'jovens' | 'relampago'

export interface ModoConfig {
  id: ModoId
  label: string
  emoji: string
  descricao: string
  corFundo: string   // tailwind bg class
  corBorda: string   // tailwind border class
  corTexto: string   // tailwind text class
  totalPistas?: number  // override de TOTAL_PISTAS (Relâmpago = 3)
}

export const MODOS_CONFIG: ModoConfig[] = [
  {
    id: 'lenda',
    label: 'Modo Lenda',
    emoji: '🏆',
    descricao: 'Ídolos que moldaram o futebol. Você os conhece de verdade?',
    corFundo: 'bg-[#0F1D30]',
    corBorda: 'border-[#2A5275]',
    corTexto: 'text-[#FFD23F]',
  },
  {
    id: 'brasileirao',
    label: 'Modo Brasileirão',
    emoji: '🇧🇷',
    descricao: 'Só jogadores do Brasileirão. O futebol que você acompanha todo fim de semana.',
    corFundo: 'bg-[#0F1D30]',
    corBorda: 'border-[#2A5275]',
    corTexto: 'text-[#00C853]',
  },
  {
    id: 'jovens',
    label: 'Modo Jovens',
    emoji: '⚡',
    descricao: 'Talentos em ascensão. Os próximos ídolos já estão em campo.',
    corFundo: 'bg-[#0F1D30]',
    corBorda: 'border-[#2A5275]',
    corTexto: 'text-[#8AB4CC]',
  },
  {
    id: 'relampago',
    label: 'Modo Relâmpago',
    emoji: '🔥',
    descricao: 'Só 3 pistas. Ou você sabe, ou não sabe. Sem segunda chance.',
    corFundo: 'bg-[#0F1D30]',
    corBorda: 'border-[#2A5275]',
    corTexto: 'text-red-400',
    totalPistas: 3,
  },
]

// ── Pools por modo ────────────────────────────────────────────

const JOVENS_FA = new Set(['17-21', '18-22', '19-23', '20-24', '21-25', '22-26'])

const POOLS: Record<ModoId, Jogador[]> = {
  lenda:       jogadores.filter(j => j.lenda === true),
  brasileirao: jogadores.filter(j => j.liga === 'Brasileirão'),
  jovens:      jogadores.filter(j => JOVENS_FA.has(j.faixaEtaria)),
  relampago:   jogadores,
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
