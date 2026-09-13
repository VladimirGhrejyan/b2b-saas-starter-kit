import {Injectable} from '@nestjs/common'
import {hash, verify} from '@node-rs/argon2'

import type {PasswordHasher} from '@b2b-saas-starter-kit/platform'

/**
 * Argon2id {@link PasswordHasher} (`@node-rs/argon2` defaults to Argon2id).
 */
@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  public hash(password: string): Promise<string> {
    return hash(password)
  }

  public async verify(password: string, passwordHash: string): Promise<boolean> {
    try {
      return await verify(passwordHash, password)
    } catch {
      return false
    }
  }
}
