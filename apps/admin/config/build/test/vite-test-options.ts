/// <reference types="vitest" />

import type {ViteUserConfig} from 'vitest/config'

export class ViteTestOptions {
  static build(): NonNullable<ViteUserConfig['test']> {
    return {
      name: 'admin',
      watch: false,
      globals: true,
      environment: 'jsdom',
      include: ['{src,tests,config}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      reporters: ['default'],
      coverage: {
        reportsDirectory: './test-output/vitest/coverage',
        provider: 'v8' as const,
      },
    }
  }
}
