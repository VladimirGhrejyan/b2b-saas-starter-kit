import type {Linter} from 'eslint'

import {ImportGroups} from './import-groups'

/** Backend import-order override for layer-first packages and API/worker apps. */
export class BackendEslintConfig {
  static readonly config: Linter.Config = {
    files: [
      'packages/domain/**/*.{ts,tsx}',
      'packages/application/**/*.{ts,tsx}',
      'packages/platform/**/*.{ts,tsx}',
      'packages/infrastructure*/**/*.{ts,tsx}',
      'packages/composition*/**/*.{ts,tsx}',
      'apps/api/**/*.{ts,tsx}',
      'apps/worker/**/*.{ts,tsx}',
    ],
    rules: {
      'simple-import-sort/imports': ['error', {groups: ImportGroups.backend}],
      '@b2b-saas-starter-kit/no-cross-context-imports': 'error',
    },
  }
}
