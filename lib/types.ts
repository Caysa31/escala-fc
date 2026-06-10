// Tipos centrais do COBRA — Quem é o Craque?

export interface Jogador {
  id: number
  nome: string          // Nome completo oficial (usado internamente)
  apelido?: string      // Nome pelo qual o jogador é conhecido (ex: "Tchouaméni", "Neymar")
  posicao: string
  nacionalidade: string
  bandeira: string
  clube: string
  liga: string
  dificuldade: 'facil' | 'medio' | 'dificil'
  titulos: string[]
  curiosidade: string
  faixaEtaria: string
  lenda?: boolean

  // Estado do clube (apenas clubes brasileiros; null para clubes do exterior)
  estadoClube?: string | null

  // Clube anterior — pista 4
  clubeAnterior?: string
  origemAnterior?: 'exterior' | 'brasil' | 'base'
  ligaAnterior?: string | null

  // Pistas personalizadas por jogador (sobrescrevem o template automático quando presentes)
  pista2?: string   // estilo de jogo — máx 60 chars (Capítulo 2)
  pista3?: string   // origem/raiz — 1-2 frases (Capítulo 3)
  pista4?: string   // trajetória — 1-2 frases (Capítulo 4)

  // IDs para integração API-Football v3 (null = lenda ou clube não mapeado)
  apiFootballTeamId?: number | null
  apiFootballLeagueId?: number | null

  // Trivia para Contrato Histórico (lendas)
  triviaContrato?: {
    pergunta: string
    opcoes: string[]
    respostaCorreta: number // índice em opcoes[]
  }
}

export type StatusTentativa = 'acerto' | 'erro' | 'pendente'

export interface Tentativa {
  nome: string
  status: StatusTentativa
}

export type StatusJogo = 'jogando' | 'ganhou' | 'perdeu'

export interface EstadoJogo {
  pistaAtual: number       // 1 a 6
  tentativas: Tentativa[]
  status: StatusJogo
  pistaUsada: number | null
}

export interface Perfil {
  apelido: string
  codigo: string
  streakAtual: number
  streakMaximo: number
  pontosTotal: number
  rodadasJogadas: number
  rodadasAcertadas: number
  ultimaRodada: string | null
}

export interface ResultadoRodada {
  rodadaId: number
  data: string
  jogadorId: number
  pistaAcerto: number | null
  pontos: number
  tentativas: Tentativa[]
}

// ── O CONTRATO ────────────────────────────────────────────────

export type StatusContrato =
  | 'aguardando_jogo'    // Aguardando a partida acontecer
  | 'resolvido'          // Partida ocorreu, bônus calculado
  | 'trivia_pendente'    // Lenda: trivia ainda não respondida
  | 'trivia_resolvida'   // Lenda: trivia respondida

export interface Contrato {
  id: string                // rodadaId + jogadorId
  rodadaId: number
  jogadorId: number
  nomeJogador: string
  bandeira: string
  clube: string
  multiplicador: number
  pistaAcerto: number
  dataAssinatura: string    // ISO date
  status: StatusContrato
  bonusBase: number         // soma dos bônus de desempenho (sem multiplicador)
  bonusTotal: number        // bonusBase × multiplicador
  desempenho?: DesempenhoPartida
}

export interface DesempenhoPartida {
  entrou: boolean
  jogou70: boolean
  criouChance: boolean
  golOuAssistencia: boolean
  golEAssistencia: boolean
  motm: boolean             // Man of the Match
  dataPartida: string
}

// Pontos de bônus por desempenho
export const BONUS_DESEMPENHO = {
  entrou:            10,
  jogou70:           20,
  criouChance:       30,
  golOuAssistencia:  50,
  golEAssistencia:   80,
  motm:             100,
} as const

// Pontuação base por pista (0 = histórico, 1-5 = pistas)
export const PONTOS_BASE: Record<number, number> = {
  0: 120, // histórico — acertou sem ver nenhuma pista
  1: 100,
  2: 80,
  3: 60,
  4: 40,
  5: 20,
}

// Multiplicadores do Contrato por pista (0 = histórico, 1-5 = pistas)
export const MULTIPLICADORES_CONTRATO: Record<number, number> = {
  0: 3.0, // histórico — bônus máximo
  1: 3.0,
  2: 2.5,
  3: 2.0,
  4: 1.5,
  5: 1.1,
}

export const TOTAL_PISTAS = 5  // Bola: 5 pistas | Copa usa 4 via totalPistasMax prop

// Labels visuais de cada pista
export const LABEL_PISTAS: Record<number, string> = {
  1: 'Sopa de Letras',
  2: 'Posição',
  3: 'Nacionalidade',
  4: 'Trajetória',
  5: 'Nome + Clube',
}

// Tipo de pista — todas texto por enquanto
export type TipoPista = 'texto'

export const TIPO_PISTAS: Record<number, TipoPista> = {
  1: 'texto',
  2: 'texto',
  3: 'texto',
  4: 'texto',
  5: 'texto',
}
