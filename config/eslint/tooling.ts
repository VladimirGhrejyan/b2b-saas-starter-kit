import type {Linter} from 'eslint'

/** Root tooling (git hooks, commitlint, config modules) — console OK; static classes intentional. */
export class ToolingEslintConfig {
  static readonly config: Linter.Config = {
    files: [
      'scripts/**/*.{js,mjs,cjs,ts}',
      'config/eslint/**/*.{ts,mts}',
      'config/commitlint/**/*.{ts,mts}',
      'commitlint.config.ts',
    ],
    rules: {
      'no-console': 'off',
      'padding-line-between-statements': 'off',
      'unicorn/no-static-only-class': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@b2b-saas-starter-kit/max-standalone-functions': 'off',
      '@b2b-saas-starter-kit/max-classes-per-file': 'off',
      '@b2b-saas-starter-kit/no-mixed-file-declarations': 'off',
    },
  }
}
