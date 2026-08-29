import {describe, expect, it} from 'vitest'

import type {CachePort} from './cache.port'

describe('CachePort', () => {
  it('accepts an in-memory-shaped fake with required TTL', async () => {
    const store = new Map<string, unknown>()
    const cache: CachePort = {
      get: async (key) => (store.has(key) ? (store.get(key) as never) : null),
      set: async (key, value, ttlSeconds) => {
        expect(ttlSeconds).toBeGreaterThan(0)
        store.set(key, value)
      },
      del: async (key) => {
        store.delete(key)
      },
    }

    await cache.set('k', {ok: true}, 60)
    await expect(cache.get<{ok: boolean}>('k')).resolves.toEqual({ok: true})
    await cache.del('k')
    await expect(cache.get('k')).resolves.toBeNull()
  })
})
