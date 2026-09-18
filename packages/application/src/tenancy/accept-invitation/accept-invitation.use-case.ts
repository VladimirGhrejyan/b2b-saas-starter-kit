import {Inject, Injectable} from '@nestjs/common'

import {MembershipId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {
  InvitationRepository,
  LocalPasswordRepository,
  MembershipRepository,
  UserRepository,
} from '@b2b-saas-starter-kit/domain'
import {
  INVITATION_REPOSITORY,
  LOCAL_PASSWORD_REPOSITORY,
  LocalPassword,
  Membership,
  MEMBERSHIP_REPOSITORY,
  User,
  USER_REPOSITORY,
} from '@b2b-saas-starter-kit/domain'

import type {
  Clock,
  EventPublisher,
  IdGenerator,
  PasswordHasher,
  TokenDigest,
  UnitOfWork,
} from '@b2b-saas-starter-kit/platform'
import {
  CLOCK,
  EVENT_PUBLISHER,
  ID_GENERATOR,
  PASSWORD_HASHER,
  TOKEN_DIGEST,
  UNIT_OF_WORK,
} from '@b2b-saas-starter-kit/platform'

import type {AuthorizationPort} from '../../shared/authorization.port'
import {AUTHORIZATION} from '../../shared/authorization.port'
import {DomainEventCollector} from '../../shared/domain-events/domain-event-collector'
import {InvalidPasswordError} from '../../shared/errors/invalid-password.error'
import {MIN_PASSWORD_LENGTH} from '../../shared/password.constants'
import {InvalidInvitationTokenError} from '../errors/invalid-invitation-token.error'
import {InvitationRegistrationRequiredError} from '../errors/invitation-registration-required.error'
import {MembershipAlreadyExistsError} from '../errors/membership-already-exists.error'

import type {AcceptInvitationCommand, AcceptInvitationResult} from './accept-invitation.types'

/**
 * Consumes an invitation token. Existing users need only the token; new users need displayName + password.
 */
@Injectable()
export class AcceptInvitationUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_DIGEST) private readonly digest: TokenDigest,
    @Inject(AUTHORIZATION) private readonly authz: AuthorizationPort,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(LOCAL_PASSWORD_REPOSITORY) private readonly passwords: LocalPasswordRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    @Inject(INVITATION_REPOSITORY) private readonly invitations: InvitationRepository,
    @Inject(EVENT_PUBLISHER) private readonly events: EventPublisher,
  ) {}

  async execute(command: AcceptInvitationCommand): Promise<AcceptInvitationResult> {
    return this.uow.run(async () => {
      const collector = new DomainEventCollector()
      const now = this.clock.now()
      const invitation = await this.invitations.findByTokenHash(this.digest.digest(command.token))

      if (invitation === null || !invitation.isActive(now)) {
        throw new InvalidInvitationTokenError()
      }

      let user = await this.users.findByEmail(invitation.email)

      if (user === null) {
        if (command.displayName === undefined || command.password === undefined) {
          throw new InvitationRegistrationRequiredError()
        }

        if (command.password.length < MIN_PASSWORD_LENGTH) {
          throw new InvalidPasswordError()
        }

        user = User.create(UserId.parse(this.ids.generate()), invitation.email, command.displayName, now)
        await this.users.save(user)
        collector.collect(user)
        await this.passwords.save(LocalPassword.create(user.id, await this.hasher.hash(command.password)))
      }

      const existing = await this.memberships.findByUserAndTenant(user.id, invitation.tenantId)

      if (existing !== null) {
        throw new MembershipAlreadyExistsError()
      }

      const membership = Membership.create(
        MembershipId.parse(this.ids.generate()),
        invitation.tenantId,
        user.id,
        invitation.roleIds,
        now,
      )

      invitation.consume(now)
      await this.memberships.save(membership)
      await this.invitations.save(invitation)
      collector.collect(membership, invitation)
      await collector.publish(this.events)
      await this.authz.invalidate(user.id, invitation.tenantId)

      return {userId: user.id, membershipId: membership.id, tenantId: invitation.tenantId}
    })
  }
}
