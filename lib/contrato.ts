// Lógica do sistema O Contrato

import {
  Contrato,
  DesempenhoPartida,
  MULTIPLICADORES_CONTRATO,
  BONUS_DESEMPENHO,
  Jogador,
} from './types'
import { assinarContratoSupabase, resolverTriviaSupabase } from './supabase'

/** Lê o supabase_id do usuário (armazenado no localStorage após sync) */
function getUsuarioId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('escalafc_supabase_id')
}

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

// ── Enriquecer contrato com dados do próximo fixture ─────────
// Chama a rota server-side /api/contrato/fixture (protege a API key)
// Fire-and-forget — não bloqueia a assinatura

async function enriquecerComFixture(
  contratoId: string,
  teamId: number,
  leagueId: number,
): Promise<void> {
  try {
    await fetch('/api/contrato/fixture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contratoId, teamId, leagueId }),
    })
  } catch (err) {
    // Falha silenciosa — contrato local já foi salvo
    console.warn('[enriquecerComFixture]', err)
  }
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

  // Sync para Supabase (fire-and-forget — não bloqueia a UI)
  const usuarioId = getUsuarioId()
  if (usuarioId) {
    void assinarContratoSupabase({
      id:           novoContrato.id,
      usuarioId,
      rodadaId,
      jogadorId:    jogador.id,
      nomeJogador:  jogador.nome,
      bandeira:     jogador.bandeira,
      clube:        jogador.clube,
      multiplicador: novoContrato.multiplicador,
      pistaAcerto,
      lenda:        jogador.lenda ?? false,
    })
  }

  // Enriquecer com próximo fixture via API-Football (apenas jogadores ativos)
  if (
    !jogador.lenda &&
    jogador.apiFootballTeamId != null &&
    jogador.apiFootballLeagueId != null
  ) {
    void enriquecerComFixture(
      novoContrato.id,
      jogador.apiFootballTeamId,
      jogador.apiFootballLeagueId,
    )
  }

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

  // Sync para Supabase (fire-and-forget)
  const usuarioId = getUsuarioId()
  if (usuarioId) {
    void resolverTriviaSupabase(contrato.id, bonusBase, bonusTotal)
  }

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
