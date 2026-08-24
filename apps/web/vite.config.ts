import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

const apiProxy = {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
    ws: true,
  },
} as const

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ["ovenplayer", "hls.js"],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: apiProxy,
  },
  preview: {
    port: 4173,
    proxy: apiProxy,
  },
})
