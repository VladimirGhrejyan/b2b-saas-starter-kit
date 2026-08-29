import type {Linter} from 'eslint'

const purityMessage =
  'frontend-core is the RTK/session/ports kernel: no ui-kit, ConfigLoader, Nest, postgres, Pino, Electron, or Capacitor.'

/** frontend-core purity overlay: presentation, backend, and native hosts stay out. */
export class FrontendCoreEslintConfig {
  static readonly config: Linter.Config = {
    files: ['packages/frontend/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {name: '@b2b-saas-starter-kit/ui-kit', message: purityMessage},
            {name: '@b2b-saas-starter-kit/config', message: purityMessage},
            {name: '@b2b-saas-starter-kit/domain', message: purityMessage},
            {name: '@b2b-saas-starter-kit/application', message: purityMessage},
            {name: '@b2b-saas-starter-kit/postgres', message: purityMessage},
            {name: '@b2b-saas-starter-kit/logger', message: purityMessage},
            {name: '@b2b-saas-starter-kit/nest-http', message: purityMessage},
            {name: '@b2b-saas-starter-kit/composition', message: purityMessage},
            {name: 'pino', message: purityMessage},
            {name: 'electron', message: purityMessage},
          ],
          patterns: [
            {
              group: [
                '@nestjs/*',
                '@b2b-saas-starter-kit/postgres',
                '@b2b-saas-starter-kit/redis',
                '@b2b-saas-starter-kit/http-client',
                '@b2b-saas-starter-kit/messaging',
                '@b2b-saas-starter-kit/infrastructure*',
                '@b2b-saas-starter-kit/composition*',
                '@b2b-saas-starter-kit/ui-kit*',
                'electron',
                'electron/*',
                '@capacitor/*',
                '@capacitor-community/*',
              ],
              message: purityMessage,
            },
          ],
        },
      ],
    },
  }
}
