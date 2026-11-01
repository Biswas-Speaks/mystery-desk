import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  envDir: fileURLToPath(new URL('../config/client', import.meta.url)),
  plugins: [react(), tailwindcss()],
  server: { proxy: { '/api': 'http://127.0.0.1:5000' } },
});
