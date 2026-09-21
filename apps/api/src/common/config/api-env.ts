export type ApiEnv = Pick<
  NodeJS.ProcessEnv,
  | 'NODE_ENV'
  | 'PORT'
  | 'DATABASE_URL'
  | 'REDIS_URL'
  | 'JWT_ACCESS_SECRET'
  | 'SWAGGER_BASIC_AUTH_PASSWORD'
  | 'MAIL_PASS'
  | 'MAIL_API_KEY'
  | 'CONFIG_DIR'
  | 'CONFIG_OVERLAY'
>

export const API_ENV_OVERLAY = {
  nodeEnv: 'NODE_ENV',
  'http.port': 'PORT',
  'postgres.url': 'DATABASE_URL',
  'redis.url': 'REDIS_URL',
  'jwt.accessSecret': 'JWT_ACCESS_SECRET',
  'http.swagger.basicAuth.password': 'SWAGGER_BASIC_AUTH_PASSWORD',
  'mail.pass': 'MAIL_PASS',
  'mail.apiKey': 'MAIL_API_KEY',
} as const satisfies Record<string, keyof ApiEnv>
