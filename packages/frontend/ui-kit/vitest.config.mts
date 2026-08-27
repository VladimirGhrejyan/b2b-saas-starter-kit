/// <reference types="vitest" />
import {fileURLToPath} from 'node:url'

import react from '@vitejs/plugin-react-swc'
import {defineConfig} from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(() => ({
  root,
  cacheDir: '../../../node_modules/.vite/packages/frontend/ui-kit',
  plugins: [react()],
  test: {
    name: 'ui-kit',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}))
