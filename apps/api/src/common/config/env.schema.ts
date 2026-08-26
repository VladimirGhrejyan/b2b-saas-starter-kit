import {z} from 'zod'

/** Env-driven bootstrap contract for the API process. */
export const ApiEnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  APP_TYPE: z.literal('api').default('api'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_TITLE: z.string().min(1).default('B2B SaaS API'),
  API_HOST: z.string().min(1).optional(),
  API_VERSION: z.string().min(1).default('1'),
  API_GLOBAL_PREFIX: z.string().min(1).optional(),
  API_PLAIN_HTTP: z.enum(['true', 'false']).optional(),
  CORS_ORIGINS: z.string().optional(),
  CORS_CREDENTIALS: z.enum(['true', 'false']).optional(),
  SWAGGER_ENABLED: z.enum(['true', 'false']).optional(),
  SWAGGER_PATH: z.string().min(1).default('/docs'),
  SWAGGER_BASIC_AUTH_USER: z.string().min(1).optional(),
  SWAGGER_BASIC_AUTH_PASSWORD: z.string().min(1).optional(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_PRETTY: z.enum(['true', 'false']).optional(),
})

export type ApiEnv = z.infer<typeof ApiEnvSchema>
