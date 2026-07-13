import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config: React plugin + dev server port fixed to 5173 so the
// server's CLIENT_URL / CORS config can rely on a predictable origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
});
