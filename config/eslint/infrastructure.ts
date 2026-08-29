import type {Linter} from 'eslint'

const postgresLoggerMessage =
  'Infrastructure may use TypeORM, pg, and @nestjs/common. Do not import contracts, composition, Redis clients, or other Nest packages.'

const redisMessage =
  'Redis adapters may use ioredis and @nestjs/common. Do not import TypeORM, contracts, composition, or other Nest packages.'

const httpClientMessage =
  'HTTP client adapters may use undici and @nestjs/common. Do not import TypeORM, ioredis, axios, got, domain, application, or other infrastructure packages.'

/** Infrastructure overlay: postgres/logger stay Redis-free; redis stays TypeORM-free; http-client stays adapter-local. */
export class InfrastructureEslintConfig {
  static readonly config: Linter.Config[] = [
    {
      files: ['packages/infrastructure/postgres/**/*.{ts,tsx}', 'packages/infrastructure/logger/**/*.{ts,tsx}'],
      ignores: ['**/*.{spec,test}.ts', '**/*.integration.spec.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {name: 'ioredis', message: postgresLoggerMessage},
              {name: 'undici', message: postgresLoggerMessage},
              {name: 'axios', message: postgresLoggerMessage},
              {name: 'got', message: postgresLoggerMessage},
              {name: '@b2b-saas-starter-kit/contracts', message: postgresLoggerMessage},
              {name: '@b2b-saas-starter-kit/http-client', message: postgresLoggerMessage},
              {name: '@nestjs/typeorm', message: postgresLoggerMessage},
              {name: 'nestjs-cls', message: postgresLoggerMessage},
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
                  '@b2b-saas-starter-kit/redis',
                  '@b2b-saas-starter-kit/http-client',
                ],
                message: postgresLoggerMessage,
              },
            ],
          },
        ],
      },
    },
    {
      files: ['packages/infrastructure/redis/**/*.{ts,tsx}'],
      ignores: ['**/*.{spec,test}.ts', '**/*.integration.spec.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {name: 'typeorm', message: redisMessage},
              {name: 'pg', message: redisMessage},
              {name: 'undici', message: redisMessage},
              {name: 'axios', message: redisMessage},
              {name: 'got', message: redisMessage},
              {name: '@b2b-saas-starter-kit/contracts', message: redisMessage},
              {name: '@b2b-saas-starter-kit/domain', message: redisMessage},
              {name: '@b2b-saas-starter-kit/application', message: redisMessage},
              {name: '@b2b-saas-starter-kit/http-client', message: redisMessage},
              {name: '@nestjs/typeorm', message: redisMessage},
              {name: 'nestjs-cls', message: redisMessage},
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
                  '@b2b-saas-starter-kit/postgres',
                  '@b2b-saas-starter-kit/http-client',
                ],
                message: redisMessage,
              },
            ],
          },
        ],
      },
    },
    {
      files: ['packages/infrastructure/http-client/**/*.{ts,tsx}'],
      ignores: ['**/*.{spec,test}.ts', '**/*.integration.spec.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {name: 'typeorm', message: httpClientMessage},
              {name: 'pg', message: httpClientMessage},
              {name: 'ioredis', message: httpClientMessage},
              {name: 'axios', message: httpClientMessage},
              {name: 'got', message: httpClientMessage},
              {name: '@b2b-saas-starter-kit/contracts', message: httpClientMessage},
              {name: '@b2b-saas-starter-kit/domain', message: httpClientMessage},
              {name: '@b2b-saas-starter-kit/application', message: httpClientMessage},
              {name: '@nestjs/typeorm', message: httpClientMessage},
              {name: 'nestjs-cls', message: httpClientMessage},
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
                  '@b2b-saas-starter-kit/postgres',
                  '@b2b-saas-starter-kit/redis',
                ],
                message: httpClientMessage,
              },
            ],
          },
        ],
      },
    },
  ]
}
