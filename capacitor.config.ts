import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.cobradabola.app',
  appName: 'Cobra da Bola',
  webDir: 'out',

  // Aponta para o Vercel em produção — API routes continuam funcionando
  server: {
    url: 'https://cobra-craque.vercel.app',
    cleartext: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0A1626',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0A1626',
    },
  },

  android: {
    // Garante que o app use barra de status escura com fundo da nossa cor
    backgroundColor: '#0A1626',
  },

  ios: {
    contentInset: 'always',
  },
}

export default config
