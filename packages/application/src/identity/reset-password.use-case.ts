import {Injectable} from '@nestjs/common'

import type {
  LocalPasswordRepository,
  PasswordResetTokenRepository,
  RefreshSessionRepository,
} from '@b2b-saas-starter-kit/domain'

import type {Clock, PasswordHasher, TokenDigest, UnitOfWork} from '@b2b-saas-starter-kit/platform'

import {InvalidPasswordError} from './errors/invalid-password.error'
import {InvalidResetTokenError} from './errors/invalid-reset-token.error'
import {MIN_PASSWORD_LENGTH} from './authentication.constants'
import type {ResetPasswordCommand} from './reset-password.types'

/**
 * Consumes a reset token, replaces the local password hash, and revokes refresh families.
 */
@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly hasher: PasswordHasher,
    private readonly digest: TokenDigest,
    private readonly passwords: LocalPasswordRepository,
    private readonly resetTokens: PasswordResetTokenRepository,
    private readonly sessions: RefreshSessionRepository,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<void> {
    if (command.password.length < MIN_PASSWORD_LENGTH) {
      throw new InvalidPasswordError()
    }

    await this.uow.run(async () => {
      const now = this.clock.now()
      const token = await this.resetTokens.findByTokenHash(this.digest.digest(command.token))

      if (token === null || !token.isActive(now)) {
        throw new InvalidResetTokenError()
      }

      const credential = await this.passwords.findByUserId(token.id)

      if (credential === null) {
        throw new InvalidResetTokenError()
      }

      token.consume(now)
      credential.replaceHash(await this.hasher.hash(command.password))

      await this.resetTokens.save(token)
      await this.passwords.save(credential)
      await this.sessions.revokeAllForUser(token.id, now)
    })
  }
}
