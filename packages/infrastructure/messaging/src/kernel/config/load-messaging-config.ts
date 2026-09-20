import {ConfigLoader} from '@b2b-saas-starter-kit/config'

import type {MessagingConfig} from './messaging-config'
import {messagingConfigSchema} from './messaging-config'

/**
 * Loads {@link MessagingConfig} from the environment. Call from bootstrap — not at import time.
 */
export function loadMessagingConfigFromEnv(env: Record<string, string | undefined> = process.env): MessagingConfig {
  return ConfigLoader.load(messagingConfigSchema, {
    source: 'env',
    keys: ['REDIS_URL', 'BULLMQ_PREFIX'],
    env,
  })
}
