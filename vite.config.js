import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: false, // Disabling this saves memory during the build process
    chunkSizeWarningLimit: 1000, // Optional: Avoids warnings for slightly larger chunks
    rollupOptions: {
      output: {
        // Automatically splits node_modules into a separate 'vendor' chunk to keep files small
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
});