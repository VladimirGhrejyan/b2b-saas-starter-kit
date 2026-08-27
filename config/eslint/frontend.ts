import type {Linter} from 'eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'

import {EslintBase} from './base'
import {ImportGroups} from './import-groups'

/** Frontend import order + React hooks/refresh overlays. */
export class FrontendEslintConfig {
  static readonly config: Linter.Config = {
    files: [
      'apps/web/**/*.{ts,tsx,jsx}',
      'apps/admin/**/*.{ts,tsx,jsx}',
      'packages/frontend/**/*.{ts,tsx,jsx}',
      '**/*.{tsx,jsx}',
    ],
    languageOptions: {
      ...EslintBase.languageOptions,
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      ...EslintBase.plugins,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    } as unknown as Linter.Config['plugins'],
    settings: {
      react: {version: 'detect'},
    },
    rules: {
      'simple-import-sort/imports': ['error', {groups: ImportGroups.frontend}],
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': ['error', {checksVoidReturn: {attributes: false}}],
      'max-lines-per-function': ['warn', 200],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': 'warn',
    },
  }
}
