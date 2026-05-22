// Mapeamento clube → URL do escudo (API-Football CDN, sem auth necessária para imagens)
// IDs padrão da API-Football

const BASE = 'https://media.api-sports.io/football/teams'

export const ESCUDOS: Record<string, string> = {
  // Brasileirão
  'Flamengo':      `${BASE}/127.png`,
  'Corinthians':   `${BASE}/131.png`,
  'São Paulo':     `${BASE}/132.png`,
  'Palmeiras':     `${BASE}/121.png`,
  'Vasco':         `${BASE}/133.png`,
  'Cruzeiro':      `${BASE}/140.png`,
  'Internacional': `${BASE}/119.png`,
  'Atlético-MG':   `${BASE}/128.png`,
  'Grêmio':        `${BASE}/120.png`,
  'Santos':        `${BASE}/136.png`,
  'Fluminense':    `${BASE}/124.png`,
  'Botafogo':      `${BASE}/130.png`,

  // Europa / Mundo
  'Real Madrid':      `${BASE}/541.png`,
  'Barcelona':        `${BASE}/529.png`,
  'Arsenal':          `${BASE}/42.png`,
  'Liverpool':        `${BASE}/40.png`,
  'Manchester City':  `${BASE}/50.png`,
  'Chelsea':          `${BASE}/49.png`,
  'Newcastle':        `${BASE}/34.png`,
  'Nottingham Forest':`${BASE}/65.png`,
  'Brentford':        `${BASE}/55.png`,
  'Lyon':             `${BASE}/80.png`,
  'Inter Miami':      `${BASE}/1616.png`,
  'Al Nassr':         `${BASE}/2932.png`,
  'Napoli':           `${BASE}/492.png`,
  'Juventus':         `${BASE}/496.png`,

  // Lendas — clube mais icônico da carreira
  'PSV':              `${BASE}/408.png`,
}

/**
 * Retorna a URL do escudo do clube.
 * Fallback: null (componente mostra abreviação com cores)
 */
export function getEscudo(clube: string): string | null {
  return ESCUDOS[clube] ?? null
}

// Cores dos clubes para fallback visual quando não há logo
export const CORES_CLUBE: Record<string, { bg: string; text: string; abrev: string }> = {
  'Flamengo':      { bg: '#CC0000', text: '#fff', abrev: 'FLA' },
  'Corinthians':   { bg: '#1a1a1a', text: '#fff', abrev: 'COR' },
  'São Paulo':     { bg: '#CC0000', text: '#fff', abrev: 'SPF' },
  'Palmeiras':     { bg: '#006400', text: '#fff', abrev: 'PAL' },
  'Vasco':         { bg: '#1a1a1a', text: '#fff', abrev: 'VAS' },
  'Cruzeiro':      { bg: '#003399', text: '#fff', abrev: 'CRU' },
  'Internacional': { bg: '#CC0000', text: '#fff', abrev: 'INT' },
  'Atlético-MG':   { bg: '#1a1a1a', text: '#fff', abrev: 'ATL' },
  'Grêmio':        { bg: '#003C8F', text: '#fff', abrev: 'GRE' },
  'Santos':        { bg: '#1a1a1a', text: '#fff', abrev: 'SAN' },
  'Fluminense':    { bg: '#8B0000', text: '#fff', abrev: 'FLU' },
  'Botafogo':      { bg: '#1a1a1a', text: '#fff', abrev: 'BOT' },
  'Real Madrid':   { bg: '#FFFFFF', text: '#000', abrev: 'RMA' },
  'Barcelona':     { bg: '#A50044', text: '#fff', abrev: 'BAR' },
  'Arsenal':       { bg: '#EF0107', text: '#fff', abrev: 'ARS' },
  'Liverpool':     { bg: '#C8102E', text: '#fff', abrev: 'LIV' },
  'Manchester City':{ bg: '#6CABDD', text: '#fff', abrev: 'MCI' },
  'Chelsea':       { bg: '#034694', text: '#fff', abrev: 'CHE' },
  'Newcastle':     { bg: '#241F20', text: '#fff', abrev: 'NEW' },
  'Nottingham Forest':{ bg: '#DD0000', text: '#fff', abrev: 'NFO' },
  'Brentford':     { bg: '#E30613', text: '#fff', abrev: 'BRE' },
  'Lyon':          { bg: '#1C2B5E', text: '#fff', abrev: 'OL' },
  'Inter Miami':   { bg: '#F7B5CD', text: '#000', abrev: 'MIA' },
  'Al Nassr':      { bg: '#FFCC00', text: '#000', abrev: 'NAS' },
}
