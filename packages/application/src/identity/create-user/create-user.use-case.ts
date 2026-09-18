import {Inject, Injectable} from '@nestjs/common'

import {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {UserRepository} from '@b2b-saas-starter-kit/domain'
import {User, USER_REPOSITORY} from '@b2b-saas-starter-kit/domain'

import type {Clock, EventPublisher, IdGenerator, UnitOfWork} from '@b2b-saas-starter-kit/platform'
import {CLOCK, EVENT_PUBLISHER, ID_GENERATOR, UNIT_OF_WORK} from '@b2b-saas-starter-kit/platform'

import {DomainEventCollector} from '../../shared/domain-events/domain-event-collector'
import {UserEmailTakenError} from '../errors/user-email-taken.error'

import type {CreateUserCommand, CreateUserResult} from './create-user.types'

/**
 * Creates a global user. No tenant and no authorization check (onboarding).
 */
@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(EVENT_PUBLISHER) private readonly events: EventPublisher,
  ) {}

  async execute(command: CreateUserCommand): Promise<CreateUserResult> {
    return this.uow.run(async () => {
      const collector = new DomainEventCollector()
      const email = command.email.trim().toLowerCase()
      const existing = await this.users.findByEmail(email)

      if (existing !== null) {
        throw new UserEmailTakenError()
      }

      const user = User.create(UserId.parse(this.ids.generate()), command.email, command.displayName, this.clock.now())

      await this.users.save(user)
      collector.collect(user)
      await collector.publish(this.events)

      return {userId: user.id}
    })
  }
}
