import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const clientRoot = fileURLToPath(new URL('./client/', import.meta.url));

export default defineConfig({
  root: clientRoot,
  base: './',
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: fileURLToPath(new URL('./dist/', import.meta.url)),
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/surkove-[name]-[hash].js',
        chunkFileNames: 'assets/surkove-[name]-[hash].js',
        assetFileNames: 'assets/surkove-[name]-[hash][extname]'
      }
    }
  }
});
