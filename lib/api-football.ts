/**
 * Integração server-side com API-Football v3
 * https://www.api-football.com/documentation-v3
 *
 * ⚠️  Usar APENAS em Server Components, API Routes e Cron Jobs.
 *     NUNCA importar no lado do cliente — expõe a API key.
 *
 * Quota free plan: 100 req/dia.
 * Custo estimado por execução do cron: ~2 req/contrato pendente.
 */

const BASE_URL = 'https://v3.football.api-sports.io'

function getHeaders(): HeadersInit {
  const key = process.env.API_FOOTBALL_KEY
  if (!key) throw new Error('API_FOOTBALL_KEY não configurada no .env.local')
  return { 'x-apisports-key': key }
}

// ── Season ────────────────────────────────────────────────────────────────────
// Ligas brasileiras e MLS usam o ano corrente como temporada.
// Ligas europeias usam o ano anterior (ex: temporada 2025 = 2025/26).

const LIGAS_ANO_CORRENTE = new Set([
  71,  // Brasileirão Série A
  73,  // Copa do Brasil
  13,  // Libertadores
  11,  // Sul-Americana
  253, // MLS
])

function getSeasonYear(leagueId: number): number {
  const ano = new Date().getFullYear()
  return LIGAS_ANO_CORRENTE.has(leagueId) ? ano : ano - 1
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface FixtureInfo {
  fixtureId:     number
  dataJogo:      string  // ISO datetime com timezone
  rodadaFutebol: string  // Ex: "Regular Season - 15", "Round of 16"
  timeCasa:      string
  timeVisitante: string
}

export interface StatsJogador {
  entrou:        boolean
  minutos:       number
  gols:          number
  assistencias:  number
  passesChave:   number
  rating:        number | null
}

// ── Busca próximo fixture ─────────────────────────────────────────────────────

export async function buscarProximoFixture(
  teamId: number,
  leagueId: number,
): Promise<FixtureInfo | null> {
  const season = getSeasonYear(leagueId)
  const url = `${BASE_URL}/fixtures?team=${teamId}&league=${leagueId}&season=${season}&next=1`

  try {
    const res = await fetch(url, { headers: getHeaders(), cache: 'no-store' })
    if (!res.ok) {
      console.error(`[API-Football] buscarProximoFixture HTTP ${res.status}`)
      return null
    }

    const json = await res.json()
    const fixture = json.response?.[0]
    if (!fixture) return null

    return {
      fixtureId:     fixture.fixture.id,
      dataJogo:      fixture.fixture.date,
      rodadaFutebol: fixture.league.round ?? 'Rodada desconhecida',
      timeCasa:      fixture.teams.home.name,
      timeVisitante: fixture.teams.away.name,
    }
  } catch (err) {
    console.error('[API-Football] buscarProximoFixture:', err)
    return null
  }
}

// ── Verifica se a partida terminou ────────────────────────────────────────────

export async function buscarStatusFixture(
  fixtureId: number,
): Promise<{ terminou: boolean; rodadaFutebol: string } | null> {
  const url = `${BASE_URL}/fixtures?id=${fixtureId}`

  try {
    const res = await fetch(url, { headers: getHeaders(), cache: 'no-store' })
    if (!res.ok) return null

    const json = await res.json()
    const fixture = json.response?.[0]
    if (!fixture) return null

    // FT = tempo normal, AET = prorrogação, PEN = pênaltis
    const statusTerminado = new Set(['FT', 'AET', 'PEN'])
    const terminou = statusTerminado.has(fixture.fixture.status.short)

    return {
      terminou,
      rodadaFutebol: fixture.league.round ?? 'Rodada desconhecida',
    }
  } catch (err) {
    console.error('[API-Football] buscarStatusFixture:', err)
    return null
  }
}

// ── Busca estatísticas do jogador na partida ──────────────────────────────────

// Remove acentos e normaliza para comparação de nomes
function normalizarNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z\s]/g, '')
    .trim()
}

// Calcula quantas partes do nome batem (ignora partículas < 3 chars)
function scoreSimilaridade(a: string, b: string): number {
  const partesA = normalizarNome(a).split(/\s+/).filter(p => p.length >= 3)
  const partesB = normalizarNome(b).split(/\s+/).filter(p => p.length >= 3)
  let score = 0
  for (const pa of partesA) {
    for (const pb of partesB) {
      if (pa === pb || pa.includes(pb) || pb.includes(pa)) score++
    }
  }
  return score
}

interface ApiJogadorEntry {
  player: { id: number; name: string }
  statistics: Array<{
    games:  { minutes: number | null; rating: string | null }
    goals:  { total: number | null; assists: number | null }
    passes: { key: number | null }
  }>
}

export async function buscarStatsJogador(
  fixtureId: number,
  teamId: number,
  nomeJogador: string,
): Promise<StatsJogador | null> {
  const url = `${BASE_URL}/fixtures/players?fixture=${fixtureId}&team=${teamId}`

  try {
    const res = await fetch(url, { headers: getHeaders(), cache: 'no-store' })
    if (!res.ok) {
      console.error(`[API-Football] buscarStatsJogador HTTP ${res.status}`)
      return null
    }

    const json = await res.json()
    const jogadores: ApiJogadorEntry[] = json.response?.[0]?.players ?? []

    if (jogadores.length === 0) {
      console.warn(`[API-Football] Sem jogadores para fixture ${fixtureId} team ${teamId}`)
      return null
    }

    // Encontrar melhor match por nome
    let melhorScore = 0
    let melhor: ApiJogadorEntry | null = null

    for (const j of jogadores) {
      const score = scoreSimilaridade(nomeJogador, j.player.name)
      if (score > melhorScore) {
        melhorScore = score
        melhor = j
      }
    }

    if (!melhor || melhorScore === 0) {
      console.warn(`[API-Football] Jogador não encontrado: "${nomeJogador}" no fixture ${fixtureId}`)
      return null
    }

    const s = melhor.statistics[0]
    const minutos     = s.games.minutes      ?? 0
    const gols        = s.goals.total        ?? 0
    const assistencias = s.goals.assists     ?? 0
    const passesChave = s.passes.key         ?? 0
    const ratingRaw   = s.games.rating
    const rating      = ratingRaw ? parseFloat(ratingRaw) : null

    console.log(
      `[API-Football] "${nomeJogador}" → "${melhor.player.name}" | ` +
      `${minutos}min | ${gols}G ${assistencias}A | ${passesChave} keypass | rating ${rating}`
    )

    return { entrou: minutos > 0, minutos, gols, assistencias, passesChave, rating }
  } catch (err) {
    console.error('[API-Football] buscarStatsJogador:', err)
    return null
  }
}
