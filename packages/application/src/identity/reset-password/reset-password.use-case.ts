import {Inject, Injectable} from '@nestjs/common'

import type {
  LocalPasswordRepository,
  PasswordResetTokenRepository,
  RefreshSessionRepository,
} from '@b2b-saas-starter-kit/domain'
import {
  LOCAL_PASSWORD_REPOSITORY,
  PASSWORD_RESET_TOKEN_REPOSITORY,
  REFRESH_SESSION_REPOSITORY,
} from '@b2b-saas-starter-kit/domain'

import type {Clock, PasswordHasher, TokenDigest, UnitOfWork} from '@b2b-saas-starter-kit/platform'
import {CLOCK, PASSWORD_HASHER, TOKEN_DIGEST, UNIT_OF_WORK} from '@b2b-saas-starter-kit/platform'

import {MIN_PASSWORD_LENGTH} from '../authentication.constants'
import {InvalidPasswordError} from '../errors/invalid-password.error'
import {InvalidResetTokenError} from '../errors/invalid-reset-token.error'

import type {ResetPasswordCommand} from './reset-password.types'

/**
 * Consumes a reset token, replaces the local password hash, and revokes refresh families.
 */
@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_DIGEST) private readonly digest: TokenDigest,
    @Inject(LOCAL_PASSWORD_REPOSITORY) private readonly passwords: LocalPasswordRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY) private readonly resetTokens: PasswordResetTokenRepository,
    @Inject(REFRESH_SESSION_REPOSITORY) private readonly sessions: RefreshSessionRepository,
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
