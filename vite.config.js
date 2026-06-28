import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/ClassManager/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'CM Simulator',
        short_name: 'CM Sim',
        description: 'Cardiac monitor simulator — ACLS rhythms, defibrillator, pacer, and debrief metrics',
        theme_color: '#0d0f12',
        background_color: '#0d0f12',
        display: 'standalone',
        icons: [
          { src: 'icon.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
