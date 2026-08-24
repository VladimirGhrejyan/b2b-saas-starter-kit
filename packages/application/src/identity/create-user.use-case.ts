import {Injectable} from '@nestjs/common'

import {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {UserRepository} from '@b2b-saas-starter-kit/domain'
import {User} from '@b2b-saas-starter-kit/domain'

import type {Clock, IdGenerator, UnitOfWork} from '@b2b-saas-starter-kit/platform'

import {UserEmailTakenError} from './errors/user-email-taken.error'
import type {CreateUserCommand, CreateUserResult} from './create-user.types'

/**
 * Creates a global user. No tenant and no authorization check (onboarding).
 */
@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly users: UserRepository,
  ) {}

  async execute(command: CreateUserCommand): Promise<CreateUserResult> {
    return this.uow.run(async () => {
      const email = command.email.trim().toLowerCase()
      const existing = await this.users.findByEmail(email)

      if (existing !== null) {
        throw new UserEmailTakenError()
      }

      const user = User.create(UserId.parse(this.ids.generate()), command.email, command.displayName, this.clock.now())

      await this.users.save(user)

      return {userId: user.id}
    })
  }
}
