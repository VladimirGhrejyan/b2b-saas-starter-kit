import {Injectable} from '@nestjs/common'

import {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {LocalPasswordRepository, UserRepository} from '@b2b-saas-starter-kit/domain'
import {LocalPassword, User} from '@b2b-saas-starter-kit/domain'

import type {Clock, IdGenerator, PasswordHasher, UnitOfWork} from '@b2b-saas-starter-kit/platform'

import {MIN_PASSWORD_LENGTH} from '../authentication.constants'
import {InvalidPasswordError} from '../errors/invalid-password.error'
import {UserEmailTakenError} from '../errors/user-email-taken.error'

import type {RegisterUserCommand, RegisterUserResult} from './register-user.types'

/**
 * Creates a global user and a local password credential. Does not issue tokens.
 */
@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly hasher: PasswordHasher,
    private readonly users: UserRepository,
    private readonly passwords: LocalPasswordRepository,
  ) {}

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    if (command.password.length < MIN_PASSWORD_LENGTH) {
      throw new InvalidPasswordError()
    }

    return this.uow.run(async () => {
      const email = command.email.trim().toLowerCase()
      const existing = await this.users.findByEmail(email)

      if (existing !== null) {
        throw new UserEmailTakenError()
      }

      const user = User.create(UserId.parse(this.ids.generate()), command.email, command.displayName, this.clock.now())
      const passwordHash = await this.hasher.hash(command.password)

      await this.users.save(user)
      await this.passwords.save(LocalPassword.create(user.id, passwordHash))

      return {userId: user.id}
    })
  }
}
