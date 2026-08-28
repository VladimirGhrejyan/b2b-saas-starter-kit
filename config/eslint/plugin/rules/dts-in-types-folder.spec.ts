import {RuleTester} from '@typescript-eslint/rule-tester'
import tseslint from 'typescript-eslint'
import {afterAll, describe, it} from 'vitest'

import {dtsInTypesFolderRule} from './dts-in-types-folder'

RuleTester.afterAll = afterAll
RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
})

ruleTester.run('dts-in-types-folder', dtsInTypesFolderRule, {
  valid: [
    {
      filename: '/workspace/apps/web/src/app/@types/i18next.d.ts',
      code: `declare module 'i18next' {}`,
    },
    {
      filename: '/workspace/packages/frontend/core/src/@types/vite.d.ts',
      code: `/// <reference types="vite/client" />`,
    },
    {
      filename: '/workspace/apps/web/src/app/providers/index.tsx',
      code: `export function Providers() { return null }`,
    },
  ],
  invalid: [
    {
      filename: '/workspace/apps/web/src/i18next.d.ts',
      code: `declare module 'i18next' {}`,
      errors: [{messageId: 'misplaced'}],
    },
    {
      filename: '/workspace/apps/web/src/app/virtual-web-config.d.ts',
      code: `declare module 'virtual:web-config' {}`,
      errors: [{messageId: 'misplaced'}],
    },
  ],
})
