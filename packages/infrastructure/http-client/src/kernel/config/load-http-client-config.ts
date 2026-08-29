import {ConfigLoader} from '@b2b-saas-starter-kit/config'

import type {HttpClientConfig} from './http-client-config'
import {httpClientConfigSchema} from './http-client-config'

/**
 * Loads {@link HttpClientConfig} from the environment. Call from bootstrap — not at import time.
 */
export function loadHttpClientConfigFromEnv(env: Record<string, string | undefined> = process.env): HttpClientConfig {
  return ConfigLoader.load(httpClientConfigSchema, {
    source: 'env',
    keys: [
      'HTTP_CLIENT_TIMEOUT_MS',
      'HTTP_CLIENT_CONNECT_TIMEOUT_MS',
      'HTTP_CLIENT_POOL_MAX',
      'HTTP_CLIENT_MAX_RESPONSE_BYTES',
      'HTTP_CLIENT_USER_AGENT',
      'HTTP_CLIENT_MAX_REDIRECTS',
      'HTTPS_PROXY',
      'NO_PROXY',
    ],
    env,
  })
}
