import type {Linter} from 'eslint'

const purityMessage = 'Composition wires ports to adapters. No nest-http, contracts, logger, Pino, or nestjs-zod.'

/** Composition purity overlay: HTTP kit and contracts stay in apps/api. */
export class CompositionEslintConfig {
  static readonly config: Linter.Config = {
    files: ['packages/composition/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {name: 'pino', message: purityMessage},
            {name: 'pino-pretty', message: purityMessage},
            {name: 'nestjs-zod', message: purityMessage},
            {name: '@b2b-saas-starter-kit/contracts', message: purityMessage},
            {name: '@b2b-saas-starter-kit/logger', message: purityMessage},
            {name: '@b2b-saas-starter-kit/nest-http', message: purityMessage},
          ],
          patterns: [
            {
              group: ['pino/*', 'nestjs-zod/*', '@b2b-saas-starter-kit/nest-http/*'],
              message: purityMessage,
            },
          ],
        },
      ],
    },
  }
}
