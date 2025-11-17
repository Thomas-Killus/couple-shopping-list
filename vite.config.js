import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['shopping-cart.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Our Shopping List',
        short_name: 'Shopping List',
        description: 'Shared shopping list for couples',
        theme_color: '#667eea',
        background_color: '#667eea',
        display: 'standalone',
        scope: '/couple-shopping-list/',
        start_url: '/couple-shopping-list/',
        orientation: 'portrait',
        icons: [
          {
            src: '/couple-shopping-list/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/couple-shopping-list/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.firebaseio\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  base: '/couple-shopping-list/',
})
