/**
 * Slow password hash. Adapters must use a memory-hard algorithm (Argon2id).
 */
export interface PasswordHasher {
  hash(password: string): Promise<string>
  verify(password: string, passwordHash: string): Promise<boolean>
}
