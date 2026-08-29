import type {CachePort} from '@b2b-saas-starter-kit/platform'

import type {InMemoryCacheEntry} from './in-memory-cache.types'

/**
 * In-memory {@link CachePort} for application unit tests.
 */
export class InMemoryCache implements CachePort {
  readonly #store = new Map<string, InMemoryCacheEntry>()

  get<T>(key: string): Promise<T | null> {
    const entry = this.#store.get(key)

    if (entry === undefined) {
      return Promise.resolve(null)
    }

    if (Date.now() >= entry.expiresAt) {
      this.#store.delete(key)

      return Promise.resolve(null)
    }

    return Promise.resolve(entry.value as T)
  }

  set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    this.#store.set(key, {value, expiresAt: Date.now() + ttlSeconds * 1000})

    return Promise.resolve()
  }

  del(key: string): Promise<void> {
    this.#store.delete(key)

    return Promise.resolve()
  }
}
