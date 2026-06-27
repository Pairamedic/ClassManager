import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'ACLS Rhythm Simulator',
        short_name: 'RhythmGen',
        description: 'AHA-compliant ACLS rhythm simulator for AEMT instructors',
        theme_color: '#0d0f12',
        background_color: '#0d0f12',
        display: 'standalone',
        orientation: 'landscape',
        scope: '/rhythmgen/',
        start_url: '/rhythmgen/',
        icons: [
          { src: 'icon.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  base: '/rhythmgen/',
})
