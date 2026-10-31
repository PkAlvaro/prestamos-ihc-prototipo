import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  // Rutas relativas: funciona igual en GitHub Pages (/<repo>/) y en local.
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@modules': resolve(__dirname, 'src/modules'),
      '@core': resolve(__dirname, 'src/core'),
      '@shared': resolve(__dirname, 'src/modules/shared'),
    },
  },
  test: { environment: 'jsdom', globals: true },
})
