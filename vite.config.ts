import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Repo "fynnox-puzzle-worlds" -> gehostet unter marcel-fe.github.io/fynnox-puzzle-worlds/.
// base steuert alle Asset-Pfade (lokal '/', auf GitHub Pages '/fynnox-puzzle-worlds/').
const base = '/fynnox-puzzle-worlds/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Fynnox Puzzle Worlds',
        short_name: 'Fynnox Puzzle',
        description: 'Acht Puzzle- und Kartenspiele mit Fynnox: ein Profil, XP, Münzen und Abenteuerpfad.',
        lang: 'de',
        theme_color: '#020C17',
        background_color: '#020C17',
        /*
         * Vollbild: Als installierte App verschwindet damit auch die Statusleiste
         * des Systems, nicht nur die Browserleiste. Die Liste wird von links nach
         * rechts abgearbeitet — kann ein Gerät kein Vollbild, bleibt es bei
         * 'standalone', und im schlechtesten Fall bei 'minimal-ui'.
         * iOS wertet weder das eine noch das andere aus; dort entscheidet das
         * Meta-Tag `apple-mobile-web-app-capable` in index.html.
         */
        display_override: ['fullscreen', 'standalone', 'minimal-ui'],
        display: 'fullscreen',
        // Puzzle-Spiele werden hochkant gespielt (fynnox-adventure nutzt landscape).
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Muss eindeutig sein: alle Fynnox-Apps liegen unter marcel-fe.github.io
        // und würden sich sonst gegenseitig den Cache überschreiben.
        cacheId: 'fynnox-puzzle-worlds',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        // jpg gehört dazu, seit die Kulissen und Kachelbilder als JPEG vorliegen —
        // ohne das fehlt im Offline-Betrieb die halbe Grafik.
        globPatterns: ['**/*.{js,css,html,png,jpg,svg,woff2,mp3}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
  server: { host: true },
})
