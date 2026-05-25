/**
 * Etapa 3 — Adiciona apiFootballTeamId e apiFootballLeagueId em todos os jogadores
 *
 * IDs confirmados via TheSportsDB sync + documentação API-Football v3.
 * Lendas ficam com null (usam trivia, não precisam de fixture).
 * Rodade: node scripts/add-api-football-ids.js
 */

const fs = require('fs')
const path = require('path')

// ── League IDs ──────────────────────────────────────────────────
const LEAGUE = {
  brasileirao:    71,
  copaBrasil:     73,
  libertadores:   13,
  sulAmericana:   11,
  premierLeague:  39,
  laLiga:        140,
  bundesliga:     78,
  serieA:        135,
  ligue1:         61,
  champions:       2,
  mls:           253,
  saudiPro:      307,
}

// ── Team → { teamId, leagueId } ─────────────────────────────────
// Fonte: API-Football v3 (https://www.api-football.com)
// Confirmados: Bahia(118), Santos(128), Grêmio(130), Corinthians(131),
//              Athletico-PR(134), Real Madrid(541), Barcelona(529),
//              Juventus(496), Inter Milan(505)
const TEAM_MAP = {
  // ── Brasileirão ───────────────────────────────────────────────
  'Flamengo':           { teamId: 127,  leagueId: LEAGUE.brasileirao },
  'Corinthians':        { teamId: 131,  leagueId: LEAGUE.brasileirao },
  'São Paulo':          { teamId: 126,  leagueId: LEAGUE.brasileirao },
  'Palmeiras':          { teamId: 121,  leagueId: LEAGUE.brasileirao },
  'Vasco':              { teamId: 133,  leagueId: LEAGUE.brasileirao },
  'Cruzeiro':           { teamId: 116,  leagueId: LEAGUE.brasileirao },
  'Internacional':      { teamId: 119,  leagueId: LEAGUE.brasileirao },
  'Atlético-MG':        { teamId: 1062, leagueId: LEAGUE.brasileirao },
  'Grêmio':             { teamId: 130,  leagueId: LEAGUE.brasileirao },
  'Santos':             { teamId: 128,  leagueId: LEAGUE.brasileirao },
  'Fluminense':         { teamId: 124,  leagueId: LEAGUE.brasileirao },
  'Botafogo':           { teamId: 711,  leagueId: LEAGUE.brasileirao },
  'Fortaleza':          { teamId: 1054, leagueId: LEAGUE.brasileirao },
  'Bahia':              { teamId: 118,  leagueId: LEAGUE.brasileirao },
  'Athletico-PR':       { teamId: 134,  leagueId: LEAGUE.brasileirao },
  'Red Bull Bragantino':{ teamId: 747,  leagueId: LEAGUE.brasileirao },

  // ── La Liga ───────────────────────────────────────────────────
  'Real Madrid':        { teamId: 541,  leagueId: LEAGUE.laLiga },
  'Barcelona':          { teamId: 529,  leagueId: LEAGUE.laLiga },
  'Atlético Madrid':    { teamId: 530,  leagueId: LEAGUE.laLiga },

  // ── Premier League ────────────────────────────────────────────
  'Manchester City':    { teamId: 50,   leagueId: LEAGUE.premierLeague },
  'Liverpool':          { teamId: 40,   leagueId: LEAGUE.premierLeague },
  'Arsenal':            { teamId: 42,   leagueId: LEAGUE.premierLeague },
  'Chelsea':            { teamId: 49,   leagueId: LEAGUE.premierLeague },
  'Manchester United':  { teamId: 33,   leagueId: LEAGUE.premierLeague },
  'Tottenham':          { teamId: 47,   leagueId: LEAGUE.premierLeague },
  'Newcastle':          { teamId: 34,   leagueId: LEAGUE.premierLeague },
  'Nottingham Forest':  { teamId: 65,   leagueId: LEAGUE.premierLeague },
  'Brentford':          { teamId: 55,   leagueId: LEAGUE.premierLeague },

  // ── Bundesliga ────────────────────────────────────────────────
  'Bayern Munich':      { teamId: 157,  leagueId: LEAGUE.bundesliga },
  'Bayer Leverkusen':   { teamId: 168,  leagueId: LEAGUE.bundesliga },
  'Borussia Dortmund':  { teamId: 165,  leagueId: LEAGUE.bundesliga },

  // ── Serie A (Italy) ───────────────────────────────────────────
  'Inter Milan':        { teamId: 505,  leagueId: LEAGUE.serieA },
  'Juventus':           { teamId: 496,  leagueId: LEAGUE.serieA },
  'AC Milan':           { teamId: 489,  leagueId: LEAGUE.serieA },
  'Napoli':             { teamId: 492,  leagueId: LEAGUE.serieA },

  // ── Ligue 1 ───────────────────────────────────────────────────
  'PSG':                { teamId: 85,   leagueId: LEAGUE.ligue1 },

  // ── Outras ligas ──────────────────────────────────────────────
  'Inter Miami':        { teamId: 9568, leagueId: LEAGUE.mls },
  'Al Nassr':           { teamId: 2932, leagueId: LEAGUE.saudiPro },
}

// ── Rodar ────────────────────────────────────────────────────────

const jogadoresPath = path.join(__dirname, '../data/jogadores.json')
const jogadores = JSON.parse(fs.readFileSync(jogadoresPath, 'utf8'))

let atualizados = 0
let semMapeamento = []

for (const j of jogadores) {
  if (j.lenda) {
    // Lendas não precisam de IDs — usam trivia
    j.apiFootballTeamId = null
    j.apiFootballLeagueId = null
    continue
  }

  const mapa = TEAM_MAP[j.clube]
  if (mapa) {
    j.apiFootballTeamId = mapa.teamId
    j.apiFootballLeagueId = mapa.leagueId
    atualizados++
  } else {
    j.apiFootballTeamId = null
    j.apiFootballLeagueId = null
    semMapeamento.push(`[${j.id}] ${j.nome} — ${j.clube}`)
  }
}

fs.writeFileSync(jogadoresPath, JSON.stringify(jogadores, null, 2), 'utf8')

console.log(`\n✅ ${atualizados} jogadores atualizados com IDs da API-Football`)

if (semMapeamento.length > 0) {
  console.log(`\n⚠️  ${semMapeamento.length} jogadores sem mapeamento (teamId = null):`)
  semMapeamento.forEach(s => console.log('  ' + s))
} else {
  console.log('✅ Todos os jogadores ativos têm IDs mapeados!')
}
