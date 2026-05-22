// Tipos centrais do ESCALA FC

export interface Jogador {
  id: number
  nome: string
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

  // Mídia das pistas 1 e 2 (geradas pelo builder_escala.py)
  // Null = ainda não processado → mostra placeholder
  silhuetaUrl?: string | null   // Pista 1: vídeo de silhueta
  fotoBlurUrl?: string | null   // Pista 2: foto com blur

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

// Pontuação base por pista
export const PONTOS_BASE: Record<number, number> = {
  1: 100,
  2: 80,
  3: 60,
  4: 40,
  5: 20,
  6: 10,
}

// Multiplicadores do Contrato por pista
export const MULTIPLICADORES_CONTRATO: Record<number, number> = {
  1: 3.0,
  2: 2.5,
  3: 2.0,
  4: 1.5,
  5: 1.2,
  6: 1.1,
}

export const TOTAL_PISTAS = 6

// Labels visuais de cada pista
export const LABEL_PISTAS: Record<number, string> = {
  1: 'Silhueta',
  2: 'Foto',
  3: 'Escudo do Clube',
  4: 'Posição & Nacionalidade',
  5: 'Títulos',
  6: 'Curiosidade',
}

// Tipo de pista (mídia ou texto)
export type TipoPista = 'video' | 'imagem' | 'escudo' | 'texto'

export const TIPO_PISTAS: Record<number, TipoPista> = {
  1: 'video',
  2: 'imagem',
  3: 'escudo',
  4: 'texto',
  5: 'texto',
  6: 'texto',
}
