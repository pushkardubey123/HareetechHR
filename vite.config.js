import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: false, // Isse memory kam consume hogi
    rollupOptions: {
      output: {
        manualChunks: undefined, // Default rehne dein ya chunks chote karein
      },
    },
  },
  plugins: [react(),tailwindcss()],
})
