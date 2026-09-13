import {Injectable} from '@nestjs/common'

import {MembershipId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {MembershipRepository, RoleRepository, UserRepository} from '@b2b-saas-starter-kit/domain'
import {Membership, PermissionCatalog} from '@b2b-saas-starter-kit/domain'

import type {Clock, IdGenerator, UnitOfWork} from '@b2b-saas-starter-kit/platform'

import type {AuthorizationPort} from '../../shared/authorization.port'
import {UserNotFoundError} from '../../shared/errors/user-not-found.error'
import {MembershipAlreadyExistsError} from '../errors/membership-already-exists.error'
import {OwnerRole} from '../owner-role'

import type {AttachMemberCommand, AttachMemberResult} from './attach-member.types'

/**
 * Attaches an existing user as an active member. Does not assign the Owner role.
 */
@Injectable()
export class AttachMemberUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly authz: AuthorizationPort,
    private readonly users: UserRepository,
    private readonly memberships: MembershipRepository,
    private readonly roles: RoleRepository,
  ) {}

  async execute(command: AttachMemberCommand): Promise<AttachMemberResult> {
    await this.authz.require(command.actorId, PermissionCatalog.tenancyMembersManage, {tenantId: command.tenantId})

    return this.uow.run(async () => {
      const user = await this.users.findById(command.userId)

      if (user === null) {
        throw new UserNotFoundError()
      }

      const existing = await this.memberships.findByUserAndTenant(command.userId, command.tenantId)

      if (existing !== null) {
        throw new MembershipAlreadyExistsError()
      }

      await OwnerRole.assertAssignable(this.roles, command.tenantId, command.roleIds)

      const membership = Membership.create(
        MembershipId.parse(this.ids.generate()),
        command.tenantId,
        command.userId,
        command.roleIds,
        this.clock.now(),
      )

      await this.memberships.save(membership)
      await this.authz.invalidate(command.userId, command.tenantId)

      return {membershipId: membership.id}
    })
  }
}
