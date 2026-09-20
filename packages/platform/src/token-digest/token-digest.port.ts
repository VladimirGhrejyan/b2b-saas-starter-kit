/**
 * Fast one-way digest for opaque tokens (refresh, reset, API keys). Not for passwords.
 */
export interface TokenDigest {
  digest(value: string): string
  matches(value: string, digestHex: string): boolean
}
