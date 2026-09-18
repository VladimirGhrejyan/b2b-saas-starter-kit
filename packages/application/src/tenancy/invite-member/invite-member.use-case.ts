import {Inject, Injectable} from '@nestjs/common'

import {InvitationId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {
  InvitationRepository,
  MembershipRepository,
  RoleRepository,
  UserRepository,
} from '@b2b-saas-starter-kit/domain'
import {
  Invitation,
  INVITATION_REPOSITORY,
  MEMBERSHIP_REPOSITORY,
  PermissionCatalog,
  ROLE_REPOSITORY,
  USER_REPOSITORY,
} from '@b2b-saas-starter-kit/domain'

import type {
  Clock,
  EventPublisher,
  IdGenerator,
  MailerPort,
  TokenDigest,
  UnitOfWork,
} from '@b2b-saas-starter-kit/platform'
import {CLOCK, EVENT_PUBLISHER, ID_GENERATOR, MAILER, TOKEN_DIGEST, UNIT_OF_WORK} from '@b2b-saas-starter-kit/platform'

import type {AuthorizationPort} from '../../shared/authorization.port'
import {AUTHORIZATION} from '../../shared/authorization.port'
import {DomainEventCollector} from '../../shared/domain-events/domain-event-collector'
import {InvitationAlreadyPendingError} from '../errors/invitation-already-pending.error'
import {MembershipAlreadyExistsError} from '../errors/membership-already-exists.error'
import {INVITATION_TTL_MS} from '../invitation.constants'
import {OwnerRole} from '../owner-role'

import type {InviteMemberCommand, InviteMemberResult} from './invite-member.types'

/**
 * Creates a hashed email invitation and "sends" the raw token through {@link MailerPort}.
 */
@Injectable()
export class InviteMemberUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
    @Inject(TOKEN_DIGEST) private readonly digest: TokenDigest,
    @Inject(MAILER) private readonly mailer: MailerPort,
    @Inject(AUTHORIZATION) private readonly authz: AuthorizationPort,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(INVITATION_REPOSITORY) private readonly invitations: InvitationRepository,
    @Inject(EVENT_PUBLISHER) private readonly events: EventPublisher,
  ) {}

  async execute(command: InviteMemberCommand): Promise<InviteMemberResult> {
    await this.authz.require(command.actorId, PermissionCatalog.tenancyMembersInvite, {tenantId: command.tenantId})

    return this.uow.run(async () => {
      const collector = new DomainEventCollector()
      const email = command.email.trim().toLowerCase()
      const now = this.clock.now()

      await OwnerRole.assertAssignable(this.roles, command.tenantId, command.roleIds)

      const existingUser = await this.users.findByEmail(email)

      if (existingUser !== null) {
        const membership = await this.memberships.findByUserAndTenant(existingUser.id, command.tenantId)

        if (membership !== null) {
          throw new MembershipAlreadyExistsError()
        }
      }

      const pending = await this.invitations.findActiveByTenantAndEmail(command.tenantId, email)

      if (pending !== null && pending.isActive(now)) {
        throw new InvitationAlreadyPendingError()
      }

      if (pending !== null) {
        pending.supersede(now)
        await this.invitations.save(pending)
      }

      const rawToken = this.ids.generate()
      const invitation = Invitation.create(
        InvitationId.parse(this.ids.generate()),
        command.tenantId,
        email,
        command.roleIds,
        this.digest.digest(rawToken),
        new Date(now.getTime() + INVITATION_TTL_MS),
        command.actorId,
        now,
      )

      await this.invitations.save(invitation)
      collector.collect(invitation)
      await collector.publish(this.events)
      await this.mailer.send({
        to: email,
        subject: 'Tenant invitation',
        text: `invitation token: ${rawToken}`,
      })

      return {invitationId: invitation.id}
    })
  }
}
