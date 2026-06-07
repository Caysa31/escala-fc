// API Route — Envio de push notifications via Firebase Admin SDK
// Chamada pelos crons do Vercel (GET) e pode ser chamada manualmente (POST com CRON_SECRET)

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Inicializa Firebase Admin de forma lazy (singleton)
let adminApp: import('firebase-admin/app').App | null = null

async function getAdminMessaging() {
  const projectId   = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey  = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) return null

  try {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app')
    const { getMessaging } = await import('firebase-admin/messaging')

    if (!adminApp) {
      adminApp = getApps().length === 0
        ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
        : getApps()[0]
    }

    return getMessaging(adminApp)
  } catch (err) {
    console.warn('[FCM Admin] Erro ao inicializar:', err)
    return null
  }
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

async function enviarNotificacao(tokens: string[], titulo: string, corpo: string, url = '/') {
  const messaging = await getAdminMessaging()
  if (!messaging || tokens.length === 0) return { enviados: 0, erros: 0 }

  // Firebase suporta até 500 tokens por multicast
  const chunks: string[][] = []
  for (let i = 0; i < tokens.length; i += 500) chunks.push(tokens.slice(i, i + 500))

  let enviados = 0
  let erros = 0

  for (const chunk of chunks) {
    try {
      const res = await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: { title: titulo, body: corpo },
        webpush: {
          notification: { icon: '/icon-192.png', badge: '/icon-192.png' },
          fcmOptions: { link: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://cobra-copa.vercel.app'}${url}` },
        },
      })
      enviados += res.successCount
      erros    += res.failureCount
    } catch (err) {
      console.warn('[FCM Admin] Erro ao enviar batch:', err)
      erros += chunk.length
    }
  }

  return { enviados, erros }
}

// ── Handlers ─────────────────────────────────────────────────

// GET — chamado pelo Vercel Cron
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Detecta qual notificação enviar pela hora UTC
  const hora = new Date().getUTCHours()
  const tipo = hora === 3 ? 'diario' : hora === 23 ? 'lembrete' : 'diario'

  return enviarPorTipo(tipo)
}

// POST — chamado manualmente (testes ou trigger externo)
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && secret !== `Bearer ${cronSecret}` && secret !== cronSecret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let tipo = 'diario'
  try {
    const body = await req.json()
    tipo = body.tipo ?? 'diario'
  } catch {}

  return enviarPorTipo(tipo)
}

async function enviarPorTipo(tipo: string) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return Response.json({ error: 'Supabase não configurado' }, { status: 503 })

  if (tipo === 'diario') {
    // Busca todos os tokens ativos
    const { data: rows } = await supabase.from('notif_tokens').select('fcm_token')
    const tokens = (rows ?? []).map((r: { fcm_token: string }) => r.fcm_token).filter(Boolean)

    const resultado = await enviarNotificacao(
      tokens,
      '🐍 Novo desafio no COBRA!',
      '3 jogadores esperando você hoje. Qual é a sua sequência? 🔥',
      '/'
    )
    return Response.json({ tipo: 'diario', tokens: tokens.length, ...resultado })
  }

  if (tipo === 'lembrete') {
    const hoje = new Date().toISOString().split('T')[0]
    // Busca tokens de usuários que NÃO jogaram hoje
    const { data: rows } = await supabase
      .from('notif_tokens')
      .select('fcm_token')
      .neq('ultima_rodada', hoje)

    const tokens = (rows ?? []).map((r: { fcm_token: string }) => r.fcm_token).filter(Boolean)

    const resultado = await enviarNotificacao(
      tokens,
      '🔥 Sua sequência está em risco!',
      'Você ainda não jogou hoje. Vai deixar acabar a sequência? 😬',
      '/'
    )
    return Response.json({ tipo: 'lembrete', tokens: tokens.length, ...resultado })
  }

  return Response.json({ error: 'Tipo inválido' }, { status: 400 })
}
