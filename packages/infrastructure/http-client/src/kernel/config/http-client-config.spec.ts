import {describe, expect, it} from 'vitest'

import {httpClientConfigSchema} from './http-client-config'
import {loadHttpClientConfigFromEnv} from './load-http-client-config'

describe('httpClientConfigSchema', () => {
  it('fills defaults when env is empty', () => {
    const config = httpClientConfigSchema.parse({})

    expect(config.HTTP_CLIENT_TIMEOUT_MS).toBe(10_000)
    expect(config.HTTP_CLIENT_CONNECT_TIMEOUT_MS).toBe(5_000)
    expect(config.HTTP_CLIENT_POOL_MAX).toBe(16)
    expect(config.HTTP_CLIENT_MAX_RESPONSE_BYTES).toBe(2 * 1024 * 1024)
    expect(config.HTTP_CLIENT_USER_AGENT).toBe('b2b-saas-http-client')
    expect(config.HTTP_CLIENT_MAX_REDIRECTS).toBe(3)
  })

  it('coerces optional env strings', () => {
    const config = httpClientConfigSchema.parse({
      HTTP_CLIENT_TIMEOUT_MS: '3000',
      HTTP_CLIENT_POOL_MAX: '4',
    })

    expect(config.HTTP_CLIENT_TIMEOUT_MS).toBe(3000)
    expect(config.HTTP_CLIENT_POOL_MAX).toBe(4)
  })
})

describe('loadHttpClientConfigFromEnv', () => {
  it('loads from an empty env using schema defaults', () => {
    const config = loadHttpClientConfigFromEnv({})

    expect(config.HTTP_CLIENT_TIMEOUT_MS).toBe(10_000)
  })
})
