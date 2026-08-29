import type {Linter} from 'eslint'

const purityMessage =
  'ui-kit is presentation-only: React components. No RTK, contracts, Nest, or backend packages. No Tailwind or Radix until a later ADR.'

/** ui-kit purity overlay: data-fetching and backend layers stay out. */
export class UiKitEslintConfig {
  static readonly config: Linter.Config = {
    files: ['packages/frontend/ui-kit/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {name: '@reduxjs/toolkit', message: purityMessage},
            {name: '@b2b-saas-starter-kit/contracts', message: purityMessage},
            {name: '@b2b-saas-starter-kit/config', message: purityMessage},
            {name: '@b2b-saas-starter-kit/domain', message: purityMessage},
            {name: '@b2b-saas-starter-kit/application', message: purityMessage},
            {name: '@b2b-saas-starter-kit/postgres', message: purityMessage},
            {name: '@b2b-saas-starter-kit/logger', message: purityMessage},
            {name: '@b2b-saas-starter-kit/nest-http', message: purityMessage},
            {name: '@b2b-saas-starter-kit/composition', message: purityMessage},
            {name: 'tailwindcss', message: purityMessage},
            {name: '@radix-ui/react-slot', message: purityMessage},
          ],
          patterns: [
            {
              group: [
                '@nestjs/*',
                '@reduxjs/*',
                '@radix-ui/*',
                '@b2b-saas-starter-kit/postgres',
                '@b2b-saas-starter-kit/redis',
                '@b2b-saas-starter-kit/http-client',
                '@b2b-saas-starter-kit/messaging',
                '@b2b-saas-starter-kit/infrastructure*',
                '@b2b-saas-starter-kit/composition*',
                '@b2b-saas-starter-kit/frontend-core*',
              ],
              message: purityMessage,
            },
          ],
        },
      ],
    },
  }
}
