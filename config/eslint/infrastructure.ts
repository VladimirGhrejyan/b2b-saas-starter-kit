import type {Linter} from 'eslint'

const purityMessage =
  'Infrastructure may use TypeORM, pg, and @nestjs/common. Do not import contracts, composition, or other Nest packages.'

/** Infrastructure overlay: wire DTOs and composition stay out. */
export class InfrastructureEslintConfig {
  static readonly config: Linter.Config = {
    files: ['packages/infrastructure/**/*.{ts,tsx}'],
    ignores: ['**/*.{spec,test}.ts', '**/*.integration.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {name: 'ioredis', message: purityMessage},
            {name: '@b2b-saas-starter-kit/contracts', message: purityMessage},
            {name: '@nestjs/typeorm', message: purityMessage},
            {name: 'nestjs-cls', message: purityMessage},
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
