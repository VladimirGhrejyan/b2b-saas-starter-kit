import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    include: ['config/eslint/plugin/**/*.spec.ts'],
  },
})
