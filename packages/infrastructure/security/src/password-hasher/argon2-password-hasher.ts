import {Injectable} from '@nestjs/common'
import {argon2id, hash, verify} from 'argon2'

import type {PasswordHasher} from '@b2b-saas-starter-kit/platform'

/**
 * Argon2id {@link PasswordHasher}.
 */
@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  public hash(password: string): Promise<string> {
    return hash(password, {type: argon2id})
  }

  public async verify(password: string, passwordHash: string): Promise<boolean> {
    try {
      return await verify(passwordHash, password)
    } catch {
      return false
    }
  }
}
