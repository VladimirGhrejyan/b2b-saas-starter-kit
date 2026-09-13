import {Injectable} from '@nestjs/common'

import {InvitationId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {
  InvitationRepository,
  MembershipRepository,
  RoleRepository,
  UserRepository,
} from '@b2b-saas-starter-kit/domain'
import {Invitation, PermissionCatalog} from '@b2b-saas-starter-kit/domain'

import type {Clock, IdGenerator, MailerPort, TokenDigest, UnitOfWork} from '@b2b-saas-starter-kit/platform'

import type {AuthorizationPort} from '../shared/authorization.port'

import {InvitationAlreadyPendingError} from './errors/invitation-already-pending.error'
import {MembershipAlreadyExistsError} from './errors/membership-already-exists.error'
import {INVITATION_TTL_MS} from './invitation.constants'
import type {InviteMemberCommand, InviteMemberResult} from './invite-member.types'
import {OwnerRole} from './owner-role'

/**
 * Creates a hashed email invitation and "sends" the raw token through {@link MailerPort}.
 */
@Injectable()
export class InviteMemberUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly digest: TokenDigest,
    private readonly mailer: MailerPort,
    private readonly authz: AuthorizationPort,
    private readonly users: UserRepository,
    private readonly memberships: MembershipRepository,
    private readonly roles: RoleRepository,
    private readonly invitations: InvitationRepository,
  ) {}

  async execute(command: InviteMemberCommand): Promise<InviteMemberResult> {
    await this.authz.require(command.actorId, PermissionCatalog.tenancyMembersInvite, {tenantId: command.tenantId})

    return this.uow.run(async () => {
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
      await this.mailer.send({
        to: email,
        subject: 'Tenant invitation',
        text: `invitation token: ${rawToken}`,
      })

      return {invitationId: invitation.id}
    })
  }
}
