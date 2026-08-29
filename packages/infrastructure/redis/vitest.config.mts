import {fileURLToPath} from 'node:url'

import {defineConfig} from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(() => ({
  root,
  cacheDir: '../../../node_modules/.vite/packages/infrastructure/redis',
  test: {
    name: 'redis',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}))
