/**
 * JSON-serializable cache. `ttlSeconds` is required because Redis is ephemeral
 * with `noeviction` — expiry is correctness, not optional LRU.
 */
export interface CachePort {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>
  del(key: string): Promise<void>
}
