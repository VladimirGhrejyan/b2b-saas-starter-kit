import type {Linter} from 'eslint'

const purityMessage =
  'nest-http is a delivery kit: Nest, contracts, and platform only. No domain, application, postgres, Pino, or composition.'

/** nest-http purity overlay: domain and infrastructure stay out. */
export class NestHttpEslintConfig {
  static readonly config: Linter.Config = {
    files: ['packages/nest-http/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {name: 'pino', message: purityMessage},
            {name: 'pino-pretty', message: purityMessage},
            {name: 'typeorm', message: purityMessage},
            {name: '@b2b-saas-starter-kit/domain', message: purityMessage},
            {name: '@b2b-saas-starter-kit/application', message: purityMessage},
            {name: '@b2b-saas-starter-kit/postgres', message: purityMessage},
            {name: '@b2b-saas-starter-kit/logger', message: purityMessage},
            {name: '@b2b-saas-starter-kit/composition', message: purityMessage},
          ],
          patterns: [
            {
              group: [
                'typeorm/*',
                '@b2b-saas-starter-kit/postgres',
                '@b2b-saas-starter-kit/redis',
                '@b2b-saas-starter-kit/messaging',
                '@b2b-saas-starter-kit/infrastructure*',
                '@b2b-saas-starter-kit/composition*',
              ],
              message: purityMessage,
            },
          ],
        },
      ],
    },
  }
}
