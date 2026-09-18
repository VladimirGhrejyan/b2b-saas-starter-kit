import {Inject, Injectable} from '@nestjs/common'

import type {LocalPasswordRepository, RefreshSessionRepository, UserRepository} from '@b2b-saas-starter-kit/domain'
import {
  LOCAL_PASSWORD_REPOSITORY,
  LocalPassword,
  REFRESH_SESSION_REPOSITORY,
  USER_REPOSITORY,
} from '@b2b-saas-starter-kit/domain'

import type {Clock, PasswordHasher, UnitOfWork} from '@b2b-saas-starter-kit/platform'
import {CLOCK, PASSWORD_HASHER, UNIT_OF_WORK} from '@b2b-saas-starter-kit/platform'

import {UserNotFoundError} from '../../shared/errors/user-not-found.error'
import {MIN_PASSWORD_LENGTH} from '../authentication.constants'
import {InvalidCredentialsError} from '../errors/invalid-credentials.error'
import {InvalidPasswordError} from '../errors/invalid-password.error'
import {PasswordAlreadySetError} from '../errors/password-already-set.error'

import type {SetOrChangePasswordCommand} from './set-or-change-password.types'

/**
 * Sets a local password when missing, or replaces it when currentPassword matches.
 */
@Injectable()
export class SetOrChangePasswordUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(LOCAL_PASSWORD_REPOSITORY) private readonly passwords: LocalPasswordRepository,
    @Inject(REFRESH_SESSION_REPOSITORY) private readonly sessions: RefreshSessionRepository,
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
