import {RuleTester} from '@typescript-eslint/rule-tester'
import tseslint from 'typescript-eslint'
import {afterAll, describe, it} from 'vitest'

import {noFsdUpwardImportsRule} from './no-fsd-upward-imports'

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

const webPages = '/workspace/apps/web/src/pages/home/home-page.tsx'
const webFeatures = '/workspace/apps/web/src/features/members/index.ts'
const webShared = '/workspace/apps/web/src/shared/testing/render-with-providers.tsx'
const webApp = '/workspace/apps/web/src/app/providers/index.tsx'
const webMain = '/workspace/apps/web/src/main.ts'

ruleTester.run('no-fsd-upward-imports', noFsdUpwardImportsRule, {
  valid: [
    {
      filename: webApp,
      code: `import {HomePage} from '@/pages/home/home-page'`,
    },
    {
      filename: webPages,
      code: `import {MemberList} from '@/features/members'`,
    },
    {
      filename: webFeatures,
      code: `import {format} from '@/shared/format'`,
    },
    {
      filename: webPages,
      code: `import {paths, useRouteParams} from '@/shared/router'`,
    },
    {
      filename: webApp,
      code: `import {paths} from '@/shared/router'`,
    },
    {
      filename: webPages,
      code: `import {HomePage} from './home-page'`,
    },
    {
      filename: webMain,
      code: `import {createProductApp} from '@/app/create-product-app'`,
    },
    {
      filename: webShared,
      code: `import {z} from 'zod'`,
    },
  ],
  invalid: [
    {
      filename: webPages,
      code: `import {createProductApp} from '@/app/create-product-app'`,
      errors: [{messageId: 'upward'}],
    },
    {
      filename: webFeatures,
      code: `import {HomePage} from '@/pages/home/home-page'`,
      errors: [{messageId: 'upward'}],
    },
    {
      filename: webShared,
      code: `import {MemberList} from '@/features/members'`,
      errors: [{messageId: 'upward'}],
    },
    {
      filename: webPages,
      code: `import {createProductApp} from '../../app/create-product-app'`,
      errors: [{messageId: 'upward'}],
    },
  ],
})
