import {fileURLToPath} from 'node:url'

import {defineConfig} from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(() => ({
  root,
  cacheDir: '../../node_modules/.vite/apps/mobile',
  test: {
    name: 'mobile',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}))
