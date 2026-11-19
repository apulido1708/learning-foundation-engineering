import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    // El navegador llama a /api en el MISMO origen (5173) y Vite lo reenvía a la API.
    // Así no hay CORS que configurar. En Docker el destino es http://api:3000.
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET ?? 'http://localhost:3000',
        changeOrigin: true,
      },
    },
    // Algunos sistemas (Docker en Windows/WSL) no propagan eventos de archivos al
    // contenedor; el polling revisa cambios periódicamente a cambio de algo de CPU.
    watch: {
      usePolling: process.env.WATCH_POLLING === 'true',
    },
  },
});
