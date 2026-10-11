import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// Relative base so the build runs from any path (a preview link, a static host, a subfolder).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    target: 'es2022',
    // One bundle keeps relative loading simple on hosts that serve only static files.
    rollupOptions: { output: { inlineDynamicImports: true, entryFileNames: 'assets/app.js', assetFileNames: 'assets/[name][extname]' } },
    chunkSizeWarningLimit: 2000,
  },
  server: { port: 3100, host: true },
  preview: { port: 3100, host: true },
});
