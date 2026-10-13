import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, /api is forwarded to the Spring Boot server so the browser never hits CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
});
