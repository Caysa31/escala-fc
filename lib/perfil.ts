// Gerenciamento de perfil local (localStorage) — sem login necessário

import { Perfil, ResultadoRodada } from './types'

const CHAVE_PERFIL = 'escalafc_perfil'
const CHAVE_RESULTADOS = 'escalafc_resultados'

/**
 * Gera um código de recuperação único no formato FC-xxxxx
 */
function gerarCodigo(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let codigo = 'FC-'
  for (let i = 0; i < 5; i++) {
    codigo += chars[Math.floor(Math.random() * chars.length)]
  }
  return codigo
}

/**
 * Carrega o perfil do localStorage
 */
export function carregarPerfil(): Perfil | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CHAVE_PERFIL)
    if (!raw) return null
    return JSON.parse(raw) as Perfil
  } catch {
    return null
  }
}

/**
 * Salva o perfil no localStorage
 */
export function salvarPerfil(perfil: Perfil): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CHAVE_PERFIL, JSON.stringify(perfil))
}

/**
 * Cria um novo perfil com apelido fornecido
 */
export function criarPerfil(apelido: string): Perfil {
  const perfil: Perfil = {
    apelido: apelido.slice(0, 20).trim(),
    codigo: gerarCodigo(),
    streakAtual: 0,
    streakMaximo: 0,
    pontosTotal: 0,
    rodadasJogadas: 0,
    rodadasAcertadas: 0,
    ultimaRodada: null,
  }
  salvarPerfil(perfil)
  return perfil
}

/**
 * Verifica se o usuário já jogou hoje
 */
export function jaJogouHoje(perfil: Perfil, rodadaId: number): boolean {
  const resultados = carregarResultados()
  return resultados.some(r => r.rodadaId === rodadaId)
}

/**
 * Registra o resultado de uma rodada e atualiza o perfil
 */
export function registrarResultado(
  perfil: Perfil,
  resultado: Omit<ResultadoRodada, 'data'>
): Perfil {
  const hoje = new Date().toISOString().split('T')[0]
  const resultadoCompleto: ResultadoRodada = { ...resultado, data: hoje }

  // Salvar resultado
  const resultados = carregarResultados()
  const index = resultados.findIndex(r => r.rodadaId === resultado.rodadaId)
  if (index >= 0) {
    resultados[index] = resultadoCompleto
  } else {
    resultados.push(resultadoCompleto)
  }
  localStorage.setItem(CHAVE_RESULTADOS, JSON.stringify(resultados))

  // Atualizar streak
  const ontem = new Date()
  ontem.setDate(ontem.getDate() - 1)
  const ontemStr = ontem.toISOString().split('T')[0]

  let novoStreak = perfil.streakAtual
  if (perfil.ultimaRodada === ontemStr || perfil.ultimaRodada === null) {
    novoStreak = perfil.streakAtual + 1
  } else if (perfil.ultimaRodada !== hoje) {
    novoStreak = 1 // Quebrou o streak
  }

  // Atualizar perfil
  const perfilAtualizado: Perfil = {
    ...perfil,
    streakAtual: novoStreak,
    streakMaximo: Math.max(novoStreak, perfil.streakMaximo),
    pontosTotal: perfil.pontosTotal + resultado.pontos,
    rodadasJogadas: perfil.rodadasJogadas + (perfil.ultimaRodada !== hoje ? 1 : 0),
    rodadasAcertadas:
      perfil.rodadasAcertadas + (resultado.pistaAcerto !== null && perfil.ultimaRodada !== hoje ? 1 : 0),
    ultimaRodada: hoje,
  }

  salvarPerfil(perfilAtualizado)
  return perfilAtualizado
}

/**
 * Carrega todos os resultados históricos
 */
export function carregarResultados(): ResultadoRodada[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CHAVE_RESULTADOS)
    if (!raw) return []
    return JSON.parse(raw) as ResultadoRodada[]
  } catch {
    return []
  }
}

/**
 * Retorna o resultado da rodada atual (se já jogou)
 */
export function getResultadoRodada(rodadaId: number): ResultadoRodada | null {
  const resultados = carregarResultados()
  return resultados.find(r => r.rodadaId === rodadaId) ?? null
}

/**
 * Calcula a taxa de acerto
 */
export function calcularTaxaAcerto(perfil: Perfil): number {
  if (perfil.rodadasJogadas === 0) return 0
  return Math.round((perfil.rodadasAcertadas / perfil.rodadasJogadas) * 100)
}
