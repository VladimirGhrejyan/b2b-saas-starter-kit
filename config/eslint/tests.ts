import type {Linter} from 'eslint'
import globals from 'globals'

/** Relaxed rules for Vitest unit / integration / e2e tests. */
export class TestsEslintConfig {
  static readonly config: Linter.Config = {
    files: ['**/*.{spec,test}.{ts,tsx}', '**/test/**/*.{ts,tsx}', '**/*.e2e.spec.ts', '**/*.integration.spec.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
    },
    rules: {
      'max-lines-per-function': 'off',
      'max-depth': 'off',
      'sonarjs/cognitive-complexity': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      'no-console': 'off',
      '@b2b-saas-starter-kit/max-standalone-functions': 'off',
      '@b2b-saas-starter-kit/max-classes-per-file': 'off',
      '@b2b-saas-starter-kit/no-mixed-file-declarations': 'off',
    },
  }
}
