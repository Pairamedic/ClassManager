import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// `--mode offline` builds the local-only version: relative asset paths so it
// runs from any folder / local server, instead of the GitHub Pages sub-path.
export default defineConfig(({ mode }) => ({
  base: mode === 'offline' ? './' : '/CMSimulator/',
  plugins: [
    react(),
    VitePWA({
      // RECOVERY: ship a self-destroying service worker. Some devices are stuck
      // on an old worker that keeps serving a stale app shell (white screen) and
      // that manual cache-clearing on iOS doesn't reliably remove. This build
      // generates a worker that unregisters itself and deletes all caches on
      // every device, so the app loads fresh from the network again. Flip back
      // to a normal PWA (selfDestroying:false) once clients have recovered.
      selfDestroying: true,
      // 'autoUpdate' + skipWaiting/clientsClaim: a new deploy's service worker
      // activates on its own and takes control immediately, so users are never
      // stranded on a stale cached shell (which shows as a white screen when the
      // old shell references JS chunks the new deploy has removed).
      registerType: 'autoUpdate',
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
        // Take over from the previous service worker right away rather than
        // waiting for every old tab to close — this is what lets a broken/stale
        // client self-heal on the next load instead of staying white.
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
}))
