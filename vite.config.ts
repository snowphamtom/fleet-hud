import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages: https://snowphamtom.github.io/fleet-hud/
export default defineConfig({
  base: '/fleet-hud/',
  server: {
    port: 5174,
    strictPort: true,
  },
  preview: {
    port: 4174,
    strictPort: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Fleet HUD — Sorting Machine',
        short_name: 'Fleet HUD',
        description:
          'Phone-first fleet HUD shell for the C≤S sorting machine. Intake → Filter → Evidence → Verdict → Store.',
        theme_color: '#f7f9fc',
        background_color: '#f7f9fc',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/fleet-hud/',
        scope: '/fleet-hud/',
        lang: 'en',
        categories: ['productivity', 'utilities'],
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: '/fleet-hud/index.html',
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
