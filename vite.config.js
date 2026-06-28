import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/CMSimulator/',
  plugins: [
    react(),
    VitePWA({
      // 'prompt' surfaces a "new version available" toast instead of silently
      // swapping the app out from under an in-progress code.
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'CM Simulator',
        short_name: 'CM Sim',
        description: 'Cardiac monitor simulator — ACLS rhythms, defibrillator, pacer, and debrief metrics',
        theme_color: '#0d0f12',
        background_color: '#0d0f12',
        display: 'standalone',
        icons: [
          { src: 'pwa-192.png', type: 'image/png', sizes: '192x192', purpose: 'any' },
          { src: 'pwa-512.png', type: 'image/png', sizes: '512x512', purpose: 'any' },
          { src: 'pwa-512.png', type: 'image/png', sizes: '512x512', purpose: 'maskable' },
          { src: 'icon.svg',    type: 'image/svg+xml', sizes: 'any', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
