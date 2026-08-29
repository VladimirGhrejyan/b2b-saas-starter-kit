import type {Linter} from 'eslint'

const purityMessage =
  'Contracts must stay wire-only: Zod schemas and inferred types. No Nest, React, domain, or infrastructure.'

/** Contracts-purity overlay: framework and other layers are forbidden. */
export class ContractsEslintConfig {
  static readonly config: Linter.Config = {
    files: ['packages/shared/contracts/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {name: 'typeorm', message: purityMessage},
            {name: 'ioredis', message: purityMessage},
            {name: 'undici', message: purityMessage},
            {name: 'axios', message: purityMessage},
            {name: 'got', message: purityMessage},
            {name: 'pino', message: purityMessage},
            {name: 'react', message: purityMessage},
            {name: '@b2b-saas-starter-kit/platform', message: purityMessage},
            {name: '@b2b-saas-starter-kit/application', message: purityMessage},
            {name: '@b2b-saas-starter-kit/domain', message: purityMessage},
            {name: '@b2b-saas-starter-kit/config', message: purityMessage},
            {name: '@b2b-saas-starter-kit/logger', message: purityMessage},
            {name: '@b2b-saas-starter-kit/nest-http', message: purityMessage},
          ],
          patterns: [
            {
              group: [
                '@nestjs/*',
                'react/*',
                'typeorm/*',
                '@b2b-saas-starter-kit/postgres',
                '@b2b-saas-starter-kit/redis',
                '@b2b-saas-starter-kit/http-client',
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
