import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

declare const process: { env: Record<string, string | undefined> }

const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': apiProxyTarget,
    },
  },
  preview: {
    port: 5173,
    host: true,
    proxy: {
      '/api': apiProxyTarget,
    },
  },
})
