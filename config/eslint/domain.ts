import type {Linter} from 'eslint'

const purityMessage =
  'Domain must stay pure: no Nest, TypeORM, Redis, contracts, or other layers. Import only shared-kernel-types (and Zod when needed).'

/** Domain-purity overlay: npm packages and other workspace layers are forbidden. */
export class DomainEslintConfig {
  static readonly config: Linter.Config = {
    files: ['packages/domain/**/*.{ts,tsx}'],
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
            {name: '@b2b-saas-starter-kit/contracts', message: purityMessage},
            {name: '@b2b-saas-starter-kit/application', message: purityMessage},
            {name: '@b2b-saas-starter-kit/platform', message: purityMessage},
            {name: '@b2b-saas-starter-kit/utils', message: purityMessage},
            {name: '@b2b-saas-starter-kit/config', message: purityMessage},
          ],
          patterns: [
            {
              group: [
                '@nestjs/*',
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
