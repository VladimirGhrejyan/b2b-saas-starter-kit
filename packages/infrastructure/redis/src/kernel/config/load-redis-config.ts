import {ConfigLoader} from '@b2b-saas-starter-kit/config'

import type {RedisConfig} from './redis-config'
import {redisConfigSchema} from './redis-config'

/**
 * Loads {@link RedisConfig} from the environment. Call from bootstrap — not at import time.
 */
export function loadRedisConfigFromEnv(env: Record<string, string | undefined> = process.env): RedisConfig {
  return ConfigLoader.load(redisConfigSchema, {
    source: 'env',
    keys: ['REDIS_URL', 'REDIS_KEY_PREFIX'],
    env,
  })
}
