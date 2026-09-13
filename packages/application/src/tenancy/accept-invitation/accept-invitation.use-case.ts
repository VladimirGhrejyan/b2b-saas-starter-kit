import {Injectable} from '@nestjs/common'

import {MembershipId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {
  InvitationRepository,
  LocalPasswordRepository,
  MembershipRepository,
  UserRepository,
} from '@b2b-saas-starter-kit/domain'
import {LocalPassword, Membership, User} from '@b2b-saas-starter-kit/domain'

import type {Clock, IdGenerator, PasswordHasher, TokenDigest, UnitOfWork} from '@b2b-saas-starter-kit/platform'

import type {AuthorizationPort} from '../../shared/authorization.port'
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
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly hasher: PasswordHasher,
    private readonly digest: TokenDigest,
    private readonly authz: AuthorizationPort,
    private readonly users: UserRepository,
    private readonly passwords: LocalPasswordRepository,
    private readonly memberships: MembershipRepository,
    private readonly invitations: InvitationRepository,
  ) {}

  async execute(command: AcceptInvitationCommand): Promise<AcceptInvitationResult> {
    return this.uow.run(async () => {
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
      await this.authz.invalidate(user.id, invitation.tenantId)

      return {userId: user.id, membershipId: membership.id, tenantId: invitation.tenantId}
    })
  }
}
