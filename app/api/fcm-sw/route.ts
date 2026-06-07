// Service Worker do Firebase Messaging — servido com env vars injetadas em runtime
// Acessível em /api/fcm-sw e registrado como SW no scope '/'

export async function GET() {
  const config = {
    apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            ?? '',
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? '',
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         ?? '',
    storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID              ?? '',
  }

  const swContent = `
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(config)});
const messaging = firebase.messaging();

// Mensagens recebidas com o app fechado
messaging.onBackgroundMessage(function(payload) {
  var notif = payload.notification || {};
  var data  = payload.data || {};
  self.registration.showNotification(notif.title || 'COBRA DA COPA — Quem é o Craque?', {
    body:  notif.body  || 'Você tem novidades esperando!',
    icon:  notif.icon  || '/icon-192.png',
    badge: '/icon-192.png',
    data:  { url: data.url || '/' },
  });
});

// Clique na notificação abre o app
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(clients.openWindow(url));
});
`.trim()

  return new Response(swContent, {
    headers: {
      'Content-Type':         'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/',
      'Cache-Control':        'no-cache, no-store, must-revalidate',
    },
  })
}
