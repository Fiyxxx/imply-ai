import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [preact()],
  build: {
    lib: {
      entry:    resolve(__dirname, 'src/index.ts'),
      name:     'Imply',
      fileName: 'widget',
      formats:  ['iife'],
    },
    outDir:          '../../public',
    emptyOutDir:     false,
    minify:          true,
    rollupOptions: {
      output: {
        entryFileNames: 'widget.js',
      },
    },
  },
})
