import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // l'utente conferma l'aggiornamento invece di ricaricare a sorpresa mentre lavora
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'SmartDoc',
        short_name: 'SmartDoc',
        description: 'Fatturazione elettronica, DDT, magazzino e contabilità in un unico gestionale.',
        theme_color: '#03a9f4',
        background_color: '#051221',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Cache solo l'app shell (JS/CSS/HTML/icone): mai le risposte di /api, dove vivono numeri
        // di documento, saldi e disponibilità di magazzino. Un dato di fatturazione mostrato stantio
        // da cache è un rischio molto peggiore di un errore di rete visibile.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
  },
})
