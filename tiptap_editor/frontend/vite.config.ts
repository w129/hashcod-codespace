import { defineConfig } from 'vite'

export default defineConfig({
  base: '/tiptap_editor/frontend/build/',
  build: {
    outDir: 'build',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
})
