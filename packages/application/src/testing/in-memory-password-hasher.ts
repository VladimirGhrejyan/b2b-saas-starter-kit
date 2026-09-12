import type {PasswordHasher} from '@b2b-saas-starter-kit/platform'

/**
 * Deterministic {@link PasswordHasher} for unit tests. Not Argon2.
 */
export class InMemoryPasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return Promise.resolve(`test-hash:${password}`)
  }

  verify(password: string, passwordHash: string): Promise<boolean> {
    return Promise.resolve(passwordHash === `test-hash:${password}`)
  }
}
