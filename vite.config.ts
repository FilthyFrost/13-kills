import { defineConfig } from 'vite';

export default defineConfig({
  base: '/13-kills/',
  root: '.',
  build: {
    outDir: 'dist-web',
    rollupOptions: {
      input: 'index.html',
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
