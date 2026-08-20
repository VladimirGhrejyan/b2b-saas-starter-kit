import type {Linter} from 'eslint'

/**
 * Global ESLint ignores for the monorepo.
 * Patterns are workspace-root-relative (lint CWD), not relative to this file.
 */
export class EslintIgnores {
  static readonly config: Linter.Config = {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/out-tsc/**',
      '**/coverage/**',
      '**/test-output/**',
      '**/.nx/**',
      '**/.cursor/**',
      '**/static/**',
      'pnpm-lock.yaml',
      'graph-check.html',
      '**/*.gen.ts',
      'eslint.config.mts',
    ],
  }
}
