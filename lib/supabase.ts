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
  if (error) { console.warn('[Supabase] criarUsuario:', error.message ?? error); return null }
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

/**
 * Verifica se um apelido já está em uso no ranking global.
 * Retorna true se disponível, false se já existe.
 * Em modo offline (sem Supabase), sempre retorna true.
 */
export async function verificarApelidoDisponivel(apelido: string): Promise<boolean> {
  if (!supabase) return true
  const { data } = await supabase
    .from('usuarios')
    .select('id')
    .ilike('apelido', apelido)
    .limit(1)
  return !data || data.length === 0
}

export async function buscarUsuarioPorApelido(apelido: string) {
  if (!supabase) return null
  const { data } = await supabase
    .from('usuarios')
    .select('id, apelido, codigo')
    .ilike('apelido', apelido)
    .limit(1)
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

/**
 * Lê pontos_total do servidor para sincronizar o perfil local.
 * Usado para detectar bônus de contratos resolvidos pelo cron enquanto o usuário estava offline.
 */
export async function getPontosDoServidor(usuarioId: string): Promise<number | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('streaks')
    .select('pontos_total')
    .eq('usuario_id', usuarioId)
    .single()
  return data?.pontos_total ?? null
}

/**
 * Incrementa pontos_total no Supabase pelo bônus de um contrato resolvido.
 * Chamado pelo cron após resolver cada contrato.
 */
export async function incrementarPontosStreak(usuarioId: string, bonus: number): Promise<void> {
  if (!supabase || bonus <= 0) return
  const { data } = await supabase
    .from('streaks')
    .select('pontos_total')
    .eq('usuario_id', usuarioId)
    .single()
  const atual = data?.pontos_total ?? 0
  await supabase
    .from('streaks')
    .update({ pontos_total: atual + bonus })
    .eq('usuario_id', usuarioId)
}

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

  // Conta quantos usuários têm mais pontos que o usuário atual — posição = count + 1
  // Evita trazer todos os registros para o client (escalável)
  const [semanalResult, geralResult] = await Promise.all([
    supabase.from('ranking_semanal').select('pontos_semana').eq('id', usuarioId).single(),
    supabase.from('ranking_geral').select('pontos_total').eq('id', usuarioId).single(),
  ])

  const pontosSemanal = semanalResult.data?.pontos_semana ?? 0
  const pontosGeral   = geralResult.data?.pontos_total   ?? 0

  const [{ count: acimaSemanal }, { count: acimaGeral }] = await Promise.all([
    supabase.from('ranking_semanal').select('id', { count: 'exact', head: true }).gt('pontos_semana', pontosSemanal),
    supabase.from('ranking_geral').select('id', { count: 'exact', head: true }).gt('pontos_total', pontosGeral),
  ])

  return {
    semanal: (acimaSemanal ?? 0) + 1,
    geral:   (acimaGeral   ?? 0) + 1,
  }
}

// ── Contratos ─────────────────────────────────────────────────

export async function assinarContratoSupabase(payload: {
  id: string
  usuarioId: string
  rodadaId: number
  jogadorId: number
  nomeJogador: string
  bandeira: string
  clube: string
  multiplicador: number
  pistaAcerto: number
  lenda: boolean
}) {
  if (!supabase) return
  try {
    const { error } = await supabase.from('contratos').upsert({
      id:            payload.id,
      usuario_id:    payload.usuarioId,
      rodada_id:     payload.rodadaId,
      jogador_id:    payload.jogadorId,
      nome_jogador:  payload.nomeJogador,
      bandeira:      payload.bandeira,
      clube:         payload.clube,
      multiplicador: payload.multiplicador,
      pista_acerto:  payload.pistaAcerto,
      status:        payload.lenda ? 'trivia_pendente' : 'aguardando_jogo',
    }, { onConflict: 'id' })
    if (error) console.warn('[Supabase] assinarContratoSupabase:', error.message ?? error)
  } catch (err) {
    console.warn('[Supabase] assinarContratoSupabase exception:', err)
  }
}

export async function resolverTriviaSupabase(
  contratoId: string,
  bonusBase: number,
  bonusTotal: number
) {
  if (!supabase) return
  await supabase.from('contratos').update({
    status:       'trivia_resolvida',
    bonus_base:   bonusBase,
    bonus_total:  bonusTotal,
    resolvido_em: new Date().toISOString(),
  }).eq('id', contratoId)
}

// Salva fixture_id + data_jogo + rodada_futebol no contrato (chamado após assinar)
export async function atualizarFixtureContrato(
  contratoId:    string,
  fixtureId:     number,
  dataJogo:      string,
  rodadaFutebol: string,
  teamId:        number,
  leagueId:      number,
) {
  if (!supabase) return
  const { error } = await supabase.from('contratos').update({
    fixture_id:     fixtureId,
    data_jogo:      dataJogo,
    rodada_futebol: rodadaFutebol,
    team_id:        teamId,
    league_id:      leagueId,
  }).eq('id', contratoId)
  if (error) console.warn('[Supabase] atualizarFixtureContrato:', error.message ?? error)
}

// Resolve o contrato com dados reais da partida (chamado pelo cron)
export async function resolverContratoSupabase(
  contratoId: string,
  bonusBase:  number,
  bonusTotal: number,
  desempenho: object,
) {
  if (!supabase) return
  const { error } = await supabase.from('contratos').update({
    status:       'resolvido',
    bonus_base:   bonusBase,
    bonus_total:  bonusTotal,
    desempenho,
    resolvido_em: new Date().toISOString(),
  }).eq('id', contratoId)
  if (error) console.warn('[Supabase] resolverContratoSupabase:', error.message ?? error)
}

export async function getContratosResolvidosSupabase(usuarioId: string) {
  if (!supabase) return []
  const { data } = await supabase
    .from('contratos')
    .select('*')
    .eq('usuario_id', usuarioId)
    .in('status', ['resolvido', 'trivia_resolvida'])
    .order('resolvido_em', { ascending: false })
    .limit(50)
  return data ?? []
}

// ── Notificações Push (FCM Tokens) ───────────────────────────

export async function salvarTokenNotificacao(payload: {
  token: string
  usuarioId?: string
  apelido?: string
}): Promise<void> {
  if (!supabase) return
  try {
    await supabase.from('notif_tokens').upsert({
      fcm_token:    payload.token,
      usuario_id:   payload.usuarioId ?? null,
      apelido:      payload.apelido ?? null,
      atualizado_em: new Date().toISOString(),
    }, { onConflict: 'fcm_token' })
  } catch (err) {
    console.warn('[Supabase] salvarTokenNotificacao:', err)
  }
}

export async function atualizarUltimaRodadaToken(token: string, data: string): Promise<void> {
  if (!supabase) return
  await supabase.from('notif_tokens').update({ ultima_rodada: data }).eq('fcm_token', token)
}

// ── Salas Privadas (Multiplayer) ──────────────────────────────

export interface SalaResultado {
  id: string
  sala_id: string
  apelido: string
  pontos: number
  pista_acerto: number | null
  concluido_em: string
}

function gerarCodigoSala(): string {
  // 4 letras não ambíguas + 2 dígitos → ~600k combinações únicas
  const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const N = '23456789'
  const l = () => L[Math.floor(Math.random() * L.length)]
  const n = () => N[Math.floor(Math.random() * N.length)]
  return `${l()}${l()}${l()}${l()}${n()}${n()}`
}

export async function criarSala(jogadorId: number, criadorApelido: string, nomeLiga?: string): Promise<string | null> {
  if (!supabase) return null
  const id = gerarCodigoSala()
  const expiraEm = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase.from('salas').insert({
    id,
    jogador_id: jogadorId,
    criador_apelido: criadorApelido,
    expira_em: expiraEm,
    nome: nomeLiga ?? null,
  })
  if (error) { console.warn('[Supabase] criarSala:', error.message); return null }
  return id
}

export async function getSala(salaId: string): Promise<{ id: string; jogador_id: number; criador_apelido: string; expira_em: string; nome: string | null } | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('salas')
    .select('id, jogador_id, criador_apelido, expira_em, nome')
    .eq('id', salaId.toUpperCase())
    .single()
  return data ?? null
}

export async function salvarResultadoSala(payload: {
  salaId: string
  apelido: string
  pontos: number
  pistaAcerto: number | null
}): Promise<void> {
  if (!supabase) return
  await supabase.from('sala_resultados').upsert({
    sala_id:      payload.salaId,
    apelido:      payload.apelido,
    pontos:       payload.pontos,
    pista_acerto: payload.pistaAcerto,
  }, { onConflict: 'sala_id,apelido' })
}

export async function getResultadosSala(salaId: string): Promise<SalaResultado[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('sala_resultados')
    .select('*')
    .eq('sala_id', salaId)
    .order('pontos', { ascending: false })
    .order('pista_acerto', { ascending: true })
  return (data ?? []) as SalaResultado[]
}

export function subscribeToSala(
  salaId: string,
  onNovoResultado: (resultado: SalaResultado) => void
) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel(`sala-${salaId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'sala_resultados', filter: `sala_id=eq.${salaId}` },
      payload => onNovoResultado(payload.new as SalaResultado)
    )
    .subscribe()
  return () => { void supabase!.removeChannel(channel) }
}

// ── Liga Privada permanente ───────────────────────────────────

export interface LigaMembro {
  apelido: string
  user_id: string | null
  pontos_base: number
  pontos_liga: number     // incrementado diretamente no DB a cada desafio
  joined_at: string
}

export interface LigaInfo {
  id: string
  nome: string
  criador_apelido: string
  criada_em: string
  ativa: boolean
}

function gerarCodigoLiga(): string {
  const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const N = '23456789'
  const l = () => L[Math.floor(Math.random() * L.length)]
  const n = () => N[Math.floor(Math.random() * N.length)]
  return `${l()}${l()}${l()}${l()}${n()}${n()}`
}

export async function criarLiga(
  nome: string,
  criadorApelido: string,
  pontosBaseLocal: number
): Promise<string | null> {
  if (!supabase) return null
  const id = gerarCodigoLiga()
  const { error: ligaError } = await supabase.from('ligas').insert({
    id, nome, criador_apelido: criadorApelido, ativa: true,
  })
  if (ligaError) { console.warn('[Supabase] criarLiga:', ligaError.message); return null }

  // Criador já entra como primeiro membro
  const userId = typeof window !== 'undefined'
    ? (localStorage.getItem('escalafc_supabase_id') ?? null)
    : null

  // Usa pontos do SERVIDOR como base (mesma fonte que será consultada no placar)
  const pontosServidor = userId ? await getPontosDoServidor(userId) : null
  const pontosBase = pontosServidor ?? pontosBaseLocal

  const { error: membroError } = await supabase.from('liga_membros').insert({
    liga_id: id, apelido: criadorApelido, user_id: userId, pontos_base: pontosBase,
  })
  if (membroError) { console.warn('[Supabase] criarLiga membro:', membroError.message) }
  return id
}

export async function getLiga(ligaId: string): Promise<LigaInfo | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('ligas')
    .select('id, nome, criador_apelido, criada_em, ativa')
    .eq('id', ligaId.toUpperCase())
    .single()
  return data ?? null
}

export async function entrarLiga(
  ligaId: string,
  apelido: string,
  pontosBaseLocal: number
): Promise<boolean> {
  if (!supabase) return false
  const userId = typeof window !== 'undefined'
    ? (localStorage.getItem('escalafc_supabase_id') ?? null)
    : null

  // Usa pontos do SERVIDOR como base (mesma fonte que será consultada no placar)
  const pontosServidor = userId ? await getPontosDoServidor(userId) : null
  const pontosBase = pontosServidor ?? pontosBaseLocal

  const { error } = await supabase.from('liga_membros').upsert({
    liga_id: ligaId.toUpperCase(), apelido, user_id: userId, pontos_base: pontosBase,
  }, { onConflict: 'liga_id,apelido', ignoreDuplicates: true })
  if (error) { console.warn('[Supabase] entrarLiga:', error.message); return false }
  return true
}

export async function getMembrosLiga(ligaId: string): Promise<LigaMembro[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('liga_membros')
    .select('apelido, user_id, pontos_base, joined_at')
    .eq('liga_id', ligaId.toUpperCase())
    .order('joined_at', { ascending: true })
  return (data ?? []) as LigaMembro[]
}

// Incrementa pontos da liga diretamente — sem subtração, sem race condition
export async function incrementarPontosLiga(
  ligaId: string,
  apelido: string,
  pontosGanhos: number
): Promise<void> {
  if (!supabase || pontosGanhos <= 0) return

  // Lê valor atual
  const { data } = await supabase
    .from('liga_membros')
    .select('pontos_liga')
    .eq('liga_id', ligaId.toUpperCase())
    .eq('apelido', apelido)
    .single()

  const atual = (data as { pontos_liga?: number } | null)?.pontos_liga ?? 0

  await supabase
    .from('liga_membros')
    .update({ pontos_liga: atual + pontosGanhos })
    .eq('liga_id', ligaId.toUpperCase())
    .eq('apelido', apelido)
}

export async function getPlacarLiga(ligaId: string): Promise<LigaMembro[]> {
  if (!supabase) return []

  // Lê pontos_liga diretamente da tabela — sem cálculo, sem subtração
  const { data } = await supabase
    .from('liga_membros')
    .select('apelido, user_id, pontos_base, pontos_liga, joined_at')
    .eq('liga_id', ligaId.toUpperCase())
    .order('pontos_liga', { ascending: false })

  return (data ?? []) as LigaMembro[]
}

export function subscribeToLiga(
  ligaId: string,
  onMudanca: () => void
) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel(`liga-${ligaId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'liga_membros', filter: `liga_id=eq.${ligaId}` },
      () => onMudanca()
    )
    .subscribe()
  return () => { void supabase!.removeChannel(channel) }
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
