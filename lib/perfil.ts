// Gerenciamento de perfil local (localStorage) — sem login necessário

import { Perfil, ResultadoRodada } from './types'
import { criarUsuarioSupabase, buscarUsuarioPorCodigo, salvarResultadoSupabase, upsertStreakSupabase, getPontosDoServidor } from './supabase'

/** Lê o supabase_id do usuário (armazenado no localStorage após sync) */
function getUsuarioId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('escalafc_supabase_id')
}

/** Salva o supabase_id no localStorage */
function setUsuarioId(id: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('escalafc_supabase_id', id)
}

// Lock em memória para evitar chamadas paralelas a sincronizarPerfilSupabase
let _sincronizando = false

/**
 * Cria (ou recupera) o usuário no Supabase e armazena o ID local.
 * Fire-and-forget — não bloqueia a criação do perfil.
 */
async function sincronizarPerfilSupabase(apelido: string, codigo: string): Promise<void> {
  // Já sincronizado anteriormente
  if (getUsuarioId()) return
  // Evita chamadas concorrentes (race condition que duplicaria o usuário no Supabase)
  if (_sincronizando) return
  _sincronizando = true

  try {
    // Tentar recuperar usuário existente pelo código
    const existente = await buscarUsuarioPorCodigo(codigo)
    if (existente?.id) {
      setUsuarioId(existente.id)
      return
    }

    // Criar novo usuário no Supabase
    const novoId = await criarUsuarioSupabase(apelido, codigo)
    if (novoId) setUsuarioId(novoId)
  } finally {
    _sincronizando = false
  }
}

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
    const perfil = JSON.parse(raw) as Perfil

    // Usuário existente sem supabase_id → sincronizar em background
    if (!getUsuarioId()) {
      void sincronizarPerfilSupabase(perfil.apelido, perfil.codigo)
    }

    return perfil
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

  // Sync com Supabase (fire-and-forget — não bloqueia o fluxo)
  void sincronizarPerfilSupabase(perfil.apelido, perfil.codigo)

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
 * Registra o resultado de uma rodada e atualiza o perfil.
 * Sempre relê o perfil do localStorage para evitar race condition
 * quando dois desafios são concluídos em rápida sucessão.
 */
export function registrarResultado(
  _perfilIgnorado: Perfil,
  resultado: Omit<ResultadoRodada, 'data'>
): Perfil {
  // Relê do localStorage para garantir o estado mais recente
  const perfil = carregarPerfil() ?? _perfilIgnorado
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

  // Atualizar perfil — rodadasJogadas e rodadasAcertadas contam por desafio, não por dia
  const perfilAtualizado: Perfil = {
    ...perfil,
    streakAtual: novoStreak,
    streakMaximo: Math.max(novoStreak, perfil.streakMaximo),
    pontosTotal: perfil.pontosTotal + resultado.pontos,
    rodadasJogadas:   perfil.rodadasJogadas + 1,
    rodadasAcertadas: perfil.rodadasAcertadas + (resultado.pistaAcerto !== null ? 1 : 0),
    ultimaRodada: hoje,
  }

  salvarPerfil(perfilAtualizado)

  // Sync para Supabase (fire-and-forget — não bloqueia a UI)
  const usuarioId = getUsuarioId()
  if (usuarioId) {
    void salvarResultadoSupabase({
      usuarioId,
      rodadaId:    resultado.rodadaId,
      jogadorId:   resultado.jogadorId,
      pistaAcerto: resultado.pistaAcerto,
      pontos:      resultado.pontos,
      tentativas:  resultado.tentativas,
    })
    void upsertStreakSupabase(usuarioId, {
      streakAtual:       perfilAtualizado.streakAtual,
      streakMaximo:      perfilAtualizado.streakMaximo,
      ultimaRodada:      perfilAtualizado.ultimaRodada,
      pontosTotal:       perfilAtualizado.pontosTotal,
      rodadasJogadas:    perfilAtualizado.rodadasJogadas,
      rodadasAcertadas:  perfilAtualizado.rodadasAcertadas,
    })
  }

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
 * Aplica o bônus de um contrato (trivia ou partida real) ao perfil local.
 * Atualiza localStorage e sincroniza com Supabase.
 * Retorna o perfil atualizado, ou null se não houver perfil.
 */
export function aplicarBonusContrato(bonusTotal: number): Perfil | null {
  const perfil = carregarPerfil()
  if (!perfil || bonusTotal <= 0) return perfil

  const perfilAtualizado: Perfil = {
    ...perfil,
    pontosTotal: perfil.pontosTotal + bonusTotal,
  }
  salvarPerfil(perfilAtualizado)

  // Sync para Supabase
  const usuarioId = getUsuarioId()
  if (usuarioId) {
    void upsertStreakSupabase(usuarioId, {
      streakAtual:      perfilAtualizado.streakAtual,
      streakMaximo:     perfilAtualizado.streakMaximo,
      ultimaRodada:     perfilAtualizado.ultimaRodada,
      pontosTotal:      perfilAtualizado.pontosTotal,
      rodadasJogadas:   perfilAtualizado.rodadasJogadas,
      rodadasAcertadas: perfilAtualizado.rodadasAcertadas,
    })
  }

  return perfilAtualizado
}

/**
 * Sincroniza pontosTotal com o servidor.
 * Se o Supabase tiver pontos maiores (ex: bônus de contratos resolvidos pelo cron
 * enquanto o usuário estava offline), atualiza o perfil local.
 */
export async function sincronizarPontosDeServidor(): Promise<void> {
  if (typeof window === 'undefined') return
  const perfil = carregarPerfil()
  if (!perfil) return
  const usuarioId = getUsuarioId()
  if (!usuarioId) return

  const pontosServidor = await getPontosDoServidor(usuarioId)
  if (pontosServidor !== null && pontosServidor > perfil.pontosTotal) {
    salvarPerfil({ ...perfil, pontosTotal: pontosServidor })
  }
}

/**
 * Recupera um perfil pelo código FC-xxxxx (busca no Supabase).
 * Restaura apelido, código e pontos do servidor no localStorage.
 * Usado quando o jogador perdeu o localStorage (novo celular, limpeza de dados).
 */
export async function recuperarPerfilPorCodigo(codigoRaw: string): Promise<Perfil | null> {
  const codigo = codigoRaw.trim().toUpperCase()
  if (!codigo.startsWith('FC-') || codigo.length < 5) return null

  const usuario = await buscarUsuarioPorCodigo(codigo)
  if (!usuario?.id) return null

  setUsuarioId(usuario.id)

  const pontosServidor = await getPontosDoServidor(usuario.id)

  const perfil: Perfil = {
    apelido:          usuario.apelido,
    codigo:           usuario.codigo,
    streakAtual:      0,
    streakMaximo:     0,
    pontosTotal:      pontosServidor ?? 0,
    rodadasJogadas:   0,
    rodadasAcertadas: 0,
    ultimaRodada:     null,
  }

  salvarPerfil(perfil)
  return perfil
}

/**
 * Calcula a taxa de acerto
 */
export function calcularTaxaAcerto(perfil: Perfil): number {
  if (perfil.rodadasJogadas === 0) return 0
  return Math.round((perfil.rodadasAcertadas / perfil.rodadasJogadas) * 100)
}
