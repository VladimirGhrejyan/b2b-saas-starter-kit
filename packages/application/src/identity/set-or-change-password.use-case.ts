import {Injectable} from '@nestjs/common'

import type {LocalPasswordRepository, RefreshSessionRepository, UserRepository} from '@b2b-saas-starter-kit/domain'
import {LocalPassword} from '@b2b-saas-starter-kit/domain'

import type {Clock, PasswordHasher, UnitOfWork} from '@b2b-saas-starter-kit/platform'

import {UserNotFoundError} from '../shared/errors/user-not-found.error'

import {InvalidCredentialsError} from './errors/invalid-credentials.error'
import {InvalidPasswordError} from './errors/invalid-password.error'
import {PasswordAlreadySetError} from './errors/password-already-set.error'
import {MIN_PASSWORD_LENGTH} from './authentication.constants'
import type {SetOrChangePasswordCommand} from './set-or-change-password.types'

/**
 * Sets a local password when missing, or replaces it when currentPassword matches.
 */
@Injectable()
export class SetOrChangePasswordUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly hasher: PasswordHasher,
    private readonly users: UserRepository,
    private readonly passwords: LocalPasswordRepository,
    private readonly sessions: RefreshSessionRepository,
  ) {}

  async execute(command: SetOrChangePasswordCommand): Promise<void> {
    if (command.password.length < MIN_PASSWORD_LENGTH) {
      throw new InvalidPasswordError()
    }

    await this.uow.run(async () => {
      const user = await this.users.findById(command.actorId)

      if (user === null) {
        throw new UserNotFoundError()
      }

      const credential = await this.passwords.findByUserId(command.actorId)

      if (credential === null) {
        if (command.currentPassword !== undefined) {
          throw new InvalidCredentialsError()
        }

        await this.passwords.save(LocalPassword.create(command.actorId, await this.hasher.hash(command.password)))

        return
      }

      if (command.currentPassword === undefined) {
        throw new PasswordAlreadySetError()
      }

      const matches = await this.hasher.verify(command.currentPassword, credential.passwordHash)

      if (!matches) {
        throw new InvalidCredentialsError()
      }

      credential.replaceHash(await this.hasher.hash(command.password))
      await this.passwords.save(credential)
      await this.sessions.revokeAllForUser(command.actorId, this.clock.now())
    })
  }
}
