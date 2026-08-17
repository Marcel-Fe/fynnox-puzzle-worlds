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
        //
        // mp3 steht hier bewusst NICHT: Die Musikschleife wiegt allein 4,0 MB und
        // hätte die Installation um rund 80 % vergrößert — auch für jeden Spieler,
        // der die Musik nie einschaltet (docs/01-gamedesign.md, „Ton und Musik").
        globPatterns: ['**/*.{js,css,html,png,jpg,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        /*
         * Zwei große Dateien holen sich stattdessen selbst, wenn sie zum ersten
         * Mal gebraucht werden, und liegen danach dauerhaft im Cache:
         *
         * - die Musikschleife (3,97 MB), sobald der Schalter „Musik" an ist
         * - das 3D-Modell von Fynnox (2,4 MB), sobald jemand es öffnet
         *
         * Zusammen wären das 6,4 MB im Vorab-Cache — mehr als das Dreifache der
         * heutigen 2,58 MB, für zwei Dinge, die die meisten Spieler nie
         * anfassen (docs/01-gamedesign.md, „Ton und Musik").
         *
         * `rangeRequests` bei der Musik, weil Browser Audiodateien stückweise
         * anfordern — ohne das antwortet der Service Worker auf eine Teilanfrage
         * mit der ganzen Datei, und das Element spielt nicht ab.
         */
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.mp3'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'fynnox-puzzle-worlds-musik',
              rangeRequests: true,
              expiration: { maxEntries: 4 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.glb'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'fynnox-puzzle-worlds-modelle',
              expiration: { maxEntries: 4 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: { host: true },
})
