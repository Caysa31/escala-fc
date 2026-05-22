// Lógica do sistema O Contrato

import {
  Contrato,
  DesempenhoPartida,
  MULTIPLICADORES_CONTRATO,
  BONUS_DESEMPENHO,
  Jogador,
} from './types'

const CHAVE_CONTRATOS = 'escalafc_contratos'

// ── Persistência ──────────────────────────────────────────────

export function carregarContratos(): Contrato[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CHAVE_CONTRATOS)
    return raw ? (JSON.parse(raw) as Contrato[]) : []
  } catch {
    return []
  }
}

function salvarContratos(contratos: Contrato[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CHAVE_CONTRATOS, JSON.stringify(contratos))
}

// ── Criar contrato ────────────────────────────────────────────

export function assinarContrato(
  rodadaId: number,
  jogador: Jogador,
  pistaAcerto: number
): Contrato {
  const contratos = carregarContratos()

  // Não duplicar contrato para a mesma rodada
  const existente = contratos.find(c => c.rodadaId === rodadaId)
  if (existente) return existente

  const novoContrato: Contrato = {
    id: `${rodadaId}-${jogador.id}`,
    rodadaId,
    jogadorId: jogador.id,
    nomeJogador: jogador.nome,
    bandeira: jogador.bandeira,
    clube: jogador.clube,
    multiplicador: MULTIPLICADORES_CONTRATO[pistaAcerto] ?? 1,
    pistaAcerto,
    dataAssinatura: new Date().toISOString().split('T')[0],
    status: jogador.lenda ? 'trivia_pendente' : 'aguardando_jogo',
    bonusBase: 0,
    bonusTotal: 0,
  }

  contratos.push(novoContrato)
  salvarContratos(contratos)
  return novoContrato
}

// ── Resolver trivia (lendas) ──────────────────────────────────

export function resolverTrivia(
  rodadaId: number,
  acertou: boolean
): Contrato | null {
  const contratos = carregarContratos()
  const idx = contratos.findIndex(c => c.rodadaId === rodadaId)
  if (idx === -1) return null

  const contrato = contratos[idx]
  const bonusBase = acertou ? 80 : 0 // Bônus fixo por acertar a trivia
  const bonusTotal = Math.round(bonusBase * contrato.multiplicador)

  contratos[idx] = {
    ...contrato,
    status: 'trivia_resolvida',
    bonusBase,
    bonusTotal,
  }

  salvarContratos(contratos)
  return contratos[idx]
}

// ── Resolver com dados reais da partida ───────────────────────
// (chamado pelo cron job quando API-Football retorna os dados)

export function resolverContratoComPartida(
  rodadaId: number,
  desempenho: DesempenhoPartida
): Contrato | null {
  const contratos = carregarContratos()
  const idx = contratos.findIndex(c => c.rodadaId === rodadaId)
  if (idx === -1) return null

  const contrato = contratos[idx]
  const bonusBase = calcularBonusBase(desempenho)
  const bonusTotal = Math.round(bonusBase * contrato.multiplicador)

  contratos[idx] = {
    ...contrato,
    status: 'resolvido',
    bonusBase,
    bonusTotal,
    desempenho,
  }

  salvarContratos(contratos)
  return contratos[idx]
}

// ── Cálculo de bônus ──────────────────────────────────────────

export function calcularBonusBase(d: DesempenhoPartida): number {
  let total = 0
  if (d.entrou)              total += BONUS_DESEMPENHO.entrou
  if (d.jogou70)             total += BONUS_DESEMPENHO.jogou70
  if (d.criouChance)         total += BONUS_DESEMPENHO.criouChance
  if (d.golEAssistencia)     total += BONUS_DESEMPENHO.golEAssistencia
  else if (d.golOuAssistencia) total += BONUS_DESEMPENHO.golOuAssistencia
  if (d.motm)                total += BONUS_DESEMPENHO.motm
  return total
}

export function calcularBonusMaximo(multiplicador: number): number {
  const maxBase =
    BONUS_DESEMPENHO.entrou +
    BONUS_DESEMPENHO.jogou70 +
    BONUS_DESEMPENHO.criouChance +
    BONUS_DESEMPENHO.golEAssistencia +
    BONUS_DESEMPENHO.motm
  return Math.round(maxBase * multiplicador)
}

// ── Consultas ─────────────────────────────────────────────────

export function getContratoRodada(rodadaId: number): Contrato | null {
  return carregarContratos().find(c => c.rodadaId === rodadaId) ?? null
}

export function getContratosAtivos(): Contrato[] {
  return carregarContratos().filter(c => c.status === 'aguardando_jogo')
}

export function getContratosPendentesTrivia(): Contrato[] {
  return carregarContratos().filter(c => c.status === 'trivia_pendente')
}

export function getTotalBonusRecebidos(): number {
  return carregarContratos()
    .filter(c => c.status === 'resolvido' || c.status === 'trivia_resolvida')
    .reduce((sum, c) => sum + c.bonusTotal, 0)
}
