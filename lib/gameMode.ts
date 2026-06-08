// Sistema de modos — Cobra da Bola vs Cobra da Copa

export type GameMode = 'bola' | 'copa'

export interface ModeConfig {
  id: GameMode
  name: string
  emoji: string
  tagline: string
  subtitleColor: string   // cor do tagline
  accentColor: string     // cor principal
  description: string     // texto da tela de seleção
  playerFile: string      // qual JSON de jogadores usar
  tablePrefix: string     // prefixo das tabelas Supabase ('copa_' ou '')
  totalPistas: number     // 5 para Bola, 4 para Copa
  startDate: string       // data de início para calcular diffDias
}

export const MODES: Record<GameMode, ModeConfig> = {
  bola: {
    id: 'bola',
    name: 'COBRA DA BOLA',
    emoji: '🐍',
    tagline: 'QUEM É O CRAQUE?',
    subtitleColor: '#00C853',
    accentColor: '#00C853',
    description: 'Jogadores do Brasileirão e dos maiores clubes do mundo',
    playerFile: 'jogadores',
    tablePrefix: '',
    totalPistas: 5,
    startDate: '2026-05-22',
  },
  copa: {
    id: 'copa',
    name: 'COBRA DA COPA',
    emoji: '⚽',
    tagline: 'QUEM É O CRAQUE?',
    subtitleColor: '#FFD23F',
    accentColor: '#FFD23F',
    description: 'Jogadores da Copa do Mundo 2026 — 41 seleções',
    playerFile: 'jogadores-copa',
    tablePrefix: 'copa_',
    totalPistas: 4,
    startDate: '2026-06-01',
  },
}

const STORAGE_KEY = 'cobradabola_mode'

export function getModeAtual(): GameMode {
  if (typeof window === 'undefined') return 'bola'
  const saved = localStorage.getItem(STORAGE_KEY) as GameMode | null
  return saved === 'copa' ? 'copa' : 'bola'
}

export function setModeAtual(mode: GameMode): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, mode)
}

export function getModeConfig(mode: GameMode): ModeConfig {
  return MODES[mode]
}
