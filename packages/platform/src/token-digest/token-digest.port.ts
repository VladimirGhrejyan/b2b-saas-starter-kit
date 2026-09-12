/**
 * Fast one-way digest for opaque tokens (refresh, reset). Not for passwords.
 */
export interface TokenDigest {
  digest(value: string): string
}
