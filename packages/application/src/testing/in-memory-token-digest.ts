import type {TokenDigest} from '@b2b-saas-starter-kit/platform'

/**
 * Deterministic {@link TokenDigest} for unit tests. Not SHA-256.
 */
export class InMemoryTokenDigest implements TokenDigest {
  digest(value: string): string {
    return `test-digest:${value}`
  }

  matches(value: string, digestHex: string): boolean {
    return this.digest(value) === digestHex
  }
}
