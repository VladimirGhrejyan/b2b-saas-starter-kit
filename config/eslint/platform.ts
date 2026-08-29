import type {Linter} from 'eslint'

const purityMessage =
  'Platform must stay adapter-free: no Nest, TypeORM, Redis, domain, or other layers. Import only shared-kernel-types.'

/** Platform-purity overlay: npm packages and other workspace layers are forbidden. */
export class PlatformEslintConfig {
  static readonly config: Linter.Config = {
    files: ['packages/platform/**/*.{ts,tsx}'],
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
            {name: 'pino-pretty', message: purityMessage},
            {name: '@b2b-saas-starter-kit/contracts', message: purityMessage},
            {name: '@b2b-saas-starter-kit/application', message: purityMessage},
            {name: '@b2b-saas-starter-kit/domain', message: purityMessage},
            {name: '@b2b-saas-starter-kit/utils', message: purityMessage},
            {name: '@b2b-saas-starter-kit/config', message: purityMessage},
            {name: '@b2b-saas-starter-kit/logger', message: purityMessage},
            {name: '@b2b-saas-starter-kit/nest-http', message: purityMessage},
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
