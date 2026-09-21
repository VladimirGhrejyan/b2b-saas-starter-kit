export type WorkerEnv = Pick<
  NodeJS.ProcessEnv,
  'NODE_ENV' | 'DATABASE_URL' | 'REDIS_URL' | 'MAIL_PASS' | 'MAIL_API_KEY' | 'CONFIG_DIR' | 'CONFIG_OVERLAY'
>

export const WORKER_ENV_OVERLAY = {
  nodeEnv: 'NODE_ENV',
  'postgres.url': 'DATABASE_URL',
  'redis.url': 'REDIS_URL',
  'mail.pass': 'MAIL_PASS',
  'mail.apiKey': 'MAIL_API_KEY',
} as const satisfies Record<string, keyof WorkerEnv>
