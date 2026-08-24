import type {Linter} from 'eslint'

const purityMessage =
  'Application may import domain, platform, shared-kernel-types, and @nestjs/common only. No contracts, infrastructure, or other Nest packages.'

/** Application-purity overlay: wire DTOs and adapters are forbidden. */
export class ApplicationEslintConfig {
  static readonly config: Linter.Config = {
    files: ['packages/application/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {name: 'typeorm', message: purityMessage},
            {name: 'ioredis', message: purityMessage},
            {name: '@b2b-saas-starter-kit/contracts', message: purityMessage},
            {name: '@b2b-saas-starter-kit/config', message: purityMessage},
          ],
          patterns: [
            {
              group: [
                '@nestjs/core',
                '@nestjs/platform-*',
                '@nestjs/testing',
                '@nestjs/swagger',
                '@nestjs/config',
                '@nestjs/cqrs',
                '@nestjs/microservices',
                '@nestjs/websockets',
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
