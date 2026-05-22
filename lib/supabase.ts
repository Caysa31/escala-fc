// Cliente Supabase — ESCALA FC
// Preencha o .env.local com suas credenciais (veja .env.local.example)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Retorna null se não estiver configurado (modo offline — só localStorage)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export function isSupabaseConfigurado(): boolean {
  return supabase !== null
}

// ── Usuários ──────────────────────────────────────────────────

export async function criarUsuarioSupabase(apelido: string, codigo: string) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('usuarios')
    .insert({ apelido, codigo })
    .select('id')
    .single()
  if (error) { console.error('Supabase criarUsuario:', error); return null }
  return data?.id ?? null
}

export async function buscarUsuarioPorCodigo(codigo: string) {
  if (!supabase) return null
  const { data } = await supabase
    .from('usuarios')
    .select('id, apelido, codigo')
    .eq('codigo', codigo)
    .single()
  return data
}

// ── Resultados ────────────────────────────────────────────────

export async function salvarResultadoSupabase(payload: {
  usuarioId: string
  rodadaId: number
  jogadorId: number
  pistaAcerto: number | null
  pontos: number
  tentativas: object[]
}) {
  if (!supabase) return
  await supabase.from('resultados').upsert({
    usuario_id:   payload.usuarioId,
    rodada_id:    payload.rodadaId,
    jogador_id:   payload.jogadorId,
    pista_acerto: payload.pistaAcerto,
    pontos:       payload.pontos,
    tentativas:   payload.tentativas,
  }, { onConflict: 'usuario_id,rodada_id' })
}

// ── Streaks ───────────────────────────────────────────────────

export async function upsertStreakSupabase(usuarioId: string, dados: {
  streakAtual: number
  streakMaximo: number
  ultimaRodada: string | null
  pontosTotal: number
  rodadasJogadas: number
  rodadasAcertadas: number
}) {
  if (!supabase) return
  await supabase.from('streaks').upsert({
    usuario_id:        usuarioId,
    streak_atual:      dados.streakAtual,
    streak_maximo:     dados.streakMaximo,
    ultima_rodada:     dados.ultimaRodada,
    pontos_total:      dados.pontosTotal,
    rodadas_jogadas:   dados.rodadasJogadas,
    rodadas_acertadas: dados.rodadasAcertadas,
  }, { onConflict: 'usuario_id' })
}

// ── Ranking ───────────────────────────────────────────────────

export async function getRankingSemanal(limite = 100) {
  if (!supabase) return []
  const { data } = await supabase
    .from('ranking_semanal')
    .select('*')
    .limit(limite)
  return data ?? []
}

export async function getRankingGeral(limite = 100) {
  if (!supabase) return []
  const { data } = await supabase
    .from('ranking_geral')
    .select('*')
    .limit(limite)
  return data ?? []
}

export async function getPosicaoRanking(usuarioId: string): Promise<{ semanal: number; geral: number }> {
  if (!supabase) return { semanal: 0, geral: 0 }

  const [{ data: semanalData }, { data: geralData }] = await Promise.all([
    supabase.from('ranking_semanal').select('id'),
    supabase.from('ranking_geral').select('id'),
  ])

  const posSemanal = (semanalData ?? []).findIndex((r: {id: string}) => r.id === usuarioId) + 1
  const posGeral   = (geralData   ?? []).findIndex((r: {id: string}) => r.id === usuarioId) + 1

  return { semanal: posSemanal, geral: posGeral }
}

// ── Grupos ────────────────────────────────────────────────────

function gerarCodigoGrupo(nome: string): string {
  const slug = nome.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X')
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${slug}-${num}`
}

export async function criarGrupo(nome: string, usuarioId: string) {
  if (!supabase) return null
  const codigo = gerarCodigoGrupo(nome)

  const { data: grupo, error } = await supabase
    .from('grupos')
    .insert({ nome, codigo, criado_por: usuarioId })
    .select('id, codigo')
    .single()

  if (error || !grupo) return null

  // Adicionar criador como membro automaticamente
  await supabase.from('grupo_membros').insert({ grupo_id: grupo.id, usuario_id: usuarioId })

  return grupo
}

export async function entrarGrupo(codigo: string, usuarioId: string) {
  if (!supabase) return null

  const { data: grupo } = await supabase
    .from('grupos')
    .select('id, nome, codigo')
    .eq('codigo', codigo.toUpperCase())
    .single()

  if (!grupo) return null

  await supabase.from('grupo_membros').upsert(
    { grupo_id: grupo.id, usuario_id: usuarioId },
    { onConflict: 'grupo_id,usuario_id' }
  )

  return grupo
}

export async function getGruposDoUsuario(usuarioId: string) {
  if (!supabase) return []
  const { data } = await supabase
    .from('grupo_membros')
    .select('grupo:grupos(id, nome, codigo)')
    .eq('usuario_id', usuarioId)
  return (data ?? []).map((d: {grupo: unknown}) => d.grupo)
}

export async function getRankingGrupo(grupoId: string) {
  if (!supabase) return []

  // Buscar membros do grupo
  const { data: membros } = await supabase
    .from('grupo_membros')
    .select('usuario_id')
    .eq('grupo_id', grupoId)

  if (!membros || membros.length === 0) return []

  const ids = membros.map((m: {usuario_id: string}) => m.usuario_id)

  // Pontos da semana para esses usuários
  const { data } = await supabase
    .from('ranking_semanal')
    .select('id, apelido, pontos_semana, streak_atual')
    .in('id', ids)
    .order('pontos_semana', { ascending: false })

  return data ?? []
}
