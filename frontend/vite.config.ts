import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/AI-Sales-Outreach-Agent/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: { '/api': process.env.VITE_API_PROXY || 'http://localhost:8001' },
  },
})
