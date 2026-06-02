// Push Notifications — Firebase Cloud Messaging (FCM)
// Requer variáveis de ambiente NEXT_PUBLIC_FIREBASE_* no .env.local

'use client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _messaging: any = null

function isConfigurado(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getMessagingInstance(): Promise<any> {
  if (!isConfigurado() || typeof window === 'undefined') return null
  if (_messaging) return _messaging

  try {
    const { initializeApp, getApps } = await import('firebase/app')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getMessaging } = require('firebase/messaging')

    const config = {
      apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
      appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    }

    const app = getApps().length === 0 ? initializeApp(config) : getApps()[0]
    _messaging = getMessaging(app)
    return _messaging
  } catch (err) {
    console.warn('[FCM] Erro ao inicializar:', err)
    return null
  }
}

/** Verifica se o browser suporta notificações */
export function suportaNotificacoes(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    isConfigurado()
  )
}

/** Status atual da permissão */
export function statusPermissao(): NotificationPermission | 'indisponivel' {
  if (!suportaNotificacoes()) return 'indisponivel'
  return Notification.permission
}

/** Token FCM salvo localmente */
export function getTokenLocal(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('fcm_token')
}

/** Notificações já ativas (permissão concedida + token salvo) */
export function notificacoesAtivas(): boolean {
  return statusPermissao() === 'granted' && !!getTokenLocal()
}

/**
 * Pede permissão e retorna o token FCM.
 * Registra o Service Worker via API route (env vars injetadas em runtime).
 */
export async function pedirPermissaoNotificacoes(): Promise<string | null> {
  if (!suportaNotificacoes()) return null

  try {
    const permissao = await Notification.requestPermission()
    if (permissao !== 'granted') return null

    const messaging = await getMessagingInstance()
    if (!messaging) return null

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getToken } = require('firebase/messaging')

    // Registra o SW via API route que injeta credenciais Firebase
    const swReg = await navigator.serviceWorker.register('/api/fcm-sw', { scope: '/' })

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
      serviceWorkerRegistration: swReg,
    }) as string | undefined

    if (token) {
      localStorage.setItem('fcm_token', token)
    }

    return token ?? null
  } catch (err) {
    console.warn('[FCM] Erro ao pedir permissão:', err)
    return null
  }
}

/**
 * Escuta mensagens em foreground (app aberto).
 * Retorna função de cleanup.
 */
export async function escutarMensagens(
  onMensagem: (payload: { title?: string; body?: string }) => void
): Promise<() => void> {
  if (!suportaNotificacoes()) return () => {}

  try {
    const messaging = await getMessagingInstance()
    if (!messaging) return () => {}

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { onMessage } = require('firebase/messaging')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsubscribe = onMessage(messaging, (payload: any) => {
      onMensagem({
        title: payload.notification?.title,
        body:  payload.notification?.body,
      })
    })
    return unsubscribe
  } catch {
    return () => {}
  }
}
