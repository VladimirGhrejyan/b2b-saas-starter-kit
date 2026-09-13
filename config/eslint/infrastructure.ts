import type {Linter} from 'eslint'

import {NxBoundaries} from './nx-boundaries'

const postgresLoggerMessage =
  'Infrastructure may use TypeORM, pg, and @nestjs/common. Do not import contracts, composition, crypto adapters, Node process adapters, Redis clients, or other Nest packages.'

const redisMessage =
  'Redis adapters may use ioredis and @nestjs/common. Do not import TypeORM, contracts, composition, or other Nest packages.'

const httpClientMessage =
  'HTTP client adapters may use undici and @nestjs/common. Do not import TypeORM, ioredis, axios, got, domain, application, or other infrastructure packages.'

const securityMessage =
  'Security adapters may use @node-rs/argon2 and @nestjs/common. Do not import TypeORM, pg, ioredis, undici, domain, application, or other infrastructure packages.'

const nodeMessage =
  'Node process adapters may use uuid and @nestjs/common. Do not import @node-rs/argon2, TypeORM, pg, ioredis, undici, domain, application, or other infrastructure packages.'

const mailMessage =
  'Mail adapters may use nodemailer and @nestjs/common. Do not import TypeORM, pg, ioredis, undici, domain, application, or other infrastructure packages.'

/** Infrastructure overlay: each concern stays adapter-local. */
export class InfrastructureEslintConfig {
  static readonly config: Linter.Config[] = [
    {
      files: [
        'packages/infrastructure/postgres/**/*.{spec,test}.ts',
        'packages/infrastructure/postgres/**/*.integration.spec.ts',
      ],
      rules: {
        '@nx/enforce-module-boundaries': [
          'error',
          {
            enforceBuildableLibDependency: true,
            allow: ['@b2b-saas-starter-kit/node', '@b2b-saas-starter-kit/security'],
            depConstraints: NxBoundaries.depConstraints,
          },
        ],
      },
    },
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
              {name: 'argon2', message: postgresLoggerMessage},
              {name: '@node-rs/argon2', message: postgresLoggerMessage},
              {name: '@b2b-saas-starter-kit/contracts', message: postgresLoggerMessage},
              {name: '@b2b-saas-starter-kit/http-client', message: postgresLoggerMessage},
              {name: '@b2b-saas-starter-kit/security', message: postgresLoggerMessage},
              {name: '@b2b-saas-starter-kit/mail', message: postgresLoggerMessage},
              {name: '@b2b-saas-starter-kit/node', message: postgresLoggerMessage},
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
                  '@b2b-saas-starter-kit/security',
                  '@b2b-saas-starter-kit/node',
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
              {name: '@b2b-saas-starter-kit/security', message: redisMessage},
              {name: '@b2b-saas-starter-kit/mail', message: redisMessage},
              {name: '@b2b-saas-starter-kit/node', message: redisMessage},
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
                  '@b2b-saas-starter-kit/security',
                  '@b2b-saas-starter-kit/mail',
                  '@b2b-saas-starter-kit/node',
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
              {name: '@b2b-saas-starter-kit/security', message: httpClientMessage},
              {name: '@b2b-saas-starter-kit/mail', message: httpClientMessage},
              {name: '@b2b-saas-starter-kit/node', message: httpClientMessage},
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
                  '@b2b-saas-starter-kit/security',
                  '@b2b-saas-starter-kit/mail',
                  '@b2b-saas-starter-kit/node',
                ],
                message: httpClientMessage,
              },
            ],
          },
        ],
      },
    },
    {
      files: ['packages/infrastructure/security/**/*.{ts,tsx}'],
      ignores: ['**/*.{spec,test}.ts', '**/*.integration.spec.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {name: 'typeorm', message: securityMessage},
              {name: 'pg', message: securityMessage},
              {name: 'ioredis', message: securityMessage},
              {name: 'undici', message: securityMessage},
              {name: 'axios', message: securityMessage},
              {name: 'got', message: securityMessage},
              {name: '@b2b-saas-starter-kit/contracts', message: securityMessage},
              {name: '@b2b-saas-starter-kit/domain', message: securityMessage},
              {name: '@b2b-saas-starter-kit/application', message: securityMessage},
              {name: '@nestjs/typeorm', message: securityMessage},
              {name: 'nestjs-cls', message: securityMessage},
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
                  '@b2b-saas-starter-kit/http-client',
                  '@b2b-saas-starter-kit/mail',
                  '@b2b-saas-starter-kit/node',
                ],
                message: securityMessage,
              },
            ],
          },
        ],
      },
    },
    {
      files: ['packages/infrastructure/node/**/*.{ts,tsx}'],
      ignores: ['**/*.{spec,test}.ts', '**/*.integration.spec.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {name: 'argon2', message: nodeMessage},
              {name: '@node-rs/argon2', message: nodeMessage},
              {name: 'typeorm', message: nodeMessage},
              {name: 'pg', message: nodeMessage},
              {name: 'ioredis', message: nodeMessage},
              {name: 'undici', message: nodeMessage},
              {name: 'axios', message: nodeMessage},
              {name: 'got', message: nodeMessage},
              {name: '@b2b-saas-starter-kit/contracts', message: nodeMessage},
              {name: '@b2b-saas-starter-kit/domain', message: nodeMessage},
              {name: '@b2b-saas-starter-kit/application', message: nodeMessage},
              {name: '@nestjs/typeorm', message: nodeMessage},
              {name: 'nestjs-cls', message: nodeMessage},
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
                  '@b2b-saas-starter-kit/http-client',
                  '@b2b-saas-starter-kit/security',
                  '@b2b-saas-starter-kit/mail',
                ],
                message: nodeMessage,
              },
            ],
          },
        ],
      },
    },
    {
      files: ['packages/infrastructure/mail/**/*.{ts,tsx}'],
      ignores: ['**/*.{spec,test}.ts', '**/*.integration.spec.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {name: 'typeorm', message: mailMessage},
              {name: 'pg', message: mailMessage},
              {name: 'ioredis', message: mailMessage},
              {name: 'undici', message: mailMessage},
              {name: 'axios', message: mailMessage},
              {name: 'got', message: mailMessage},
              {name: '@b2b-saas-starter-kit/contracts', message: mailMessage},
              {name: '@b2b-saas-starter-kit/domain', message: mailMessage},
              {name: '@b2b-saas-starter-kit/application', message: mailMessage},
              {name: '@nestjs/typeorm', message: mailMessage},
              {name: 'nestjs-cls', message: mailMessage},
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
                  '@b2b-saas-starter-kit/http-client',
                  '@b2b-saas-starter-kit/security',
                  '@b2b-saas-starter-kit/node',
                ],
                message: mailMessage,
              },
            ],
          },
        ],
      },
    },
  ]
}
