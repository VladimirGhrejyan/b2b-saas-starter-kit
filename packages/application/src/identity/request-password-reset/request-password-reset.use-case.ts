import {Injectable} from '@nestjs/common'

import type {PasswordResetTokenRepository, UserRepository} from '@b2b-saas-starter-kit/domain'
import {PasswordResetToken} from '@b2b-saas-starter-kit/domain'

import type {Clock, IdGenerator, MailerPort, TokenDigest, UnitOfWork} from '@b2b-saas-starter-kit/platform'

import {PASSWORD_RESET_TTL_MS} from '../authentication.constants'

import type {RequestPasswordResetCommand} from './request-password-reset.types'

/**
 * Always succeeds. Persists a hashed token and "sends" the raw value through {@link MailerPort}.
 */
@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly digest: TokenDigest,
    private readonly mailer: MailerPort,
    private readonly users: UserRepository,
    private readonly resetTokens: PasswordResetTokenRepository,
  ) {}

  async execute(command: RequestPasswordResetCommand): Promise<void> {
    await this.uow.run(async () => {
      const user = await this.users.findByEmail(command.email.trim().toLowerCase())

      if (user === null) {
        return
      }

      const now = this.clock.now()
      const rawToken = this.ids.generate()

      await this.resetTokens.save(
        PasswordResetToken.create(
          user.id,
          this.digest.digest(rawToken),
          new Date(now.getTime() + PASSWORD_RESET_TTL_MS),
        ),
      )
      await this.mailer.send({
        to: user.email,
        subject: 'Password reset',
        text: `reset token: ${rawToken}`,
      })
    })
  }
}
