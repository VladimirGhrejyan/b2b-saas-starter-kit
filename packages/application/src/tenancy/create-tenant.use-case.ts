import {Injectable} from '@nestjs/common'

import {MembershipId, RoleId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {MembershipRepository, RoleRepository, TenantRepository, UserRepository} from '@b2b-saas-starter-kit/domain'
import {Membership, Role, SystemRoleNames, Tenant} from '@b2b-saas-starter-kit/domain'

import type {Clock, IdGenerator, UnitOfWork} from '@b2b-saas-starter-kit/platform'

import {OwnerUserNotFoundError} from './errors/owner-user-not-found.error'
import type {CreateTenantCommand, CreateTenantResult} from './create-tenant.types'

/**
 * Creates a tenant, seeds Owner/Admin/Member roles, and attaches the owner membership.
 */
@Injectable()
export class CreateTenantUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly users: UserRepository,
    private readonly tenants: TenantRepository,
    private readonly roles: RoleRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(command: CreateTenantCommand): Promise<CreateTenantResult> {
    return this.uow.run(async () => {
      const owner = await this.users.findById(command.ownerUserId)

      if (owner === null) {
        throw new OwnerUserNotFoundError()
      }

      const occurredAt = this.clock.now()
      const tenant = Tenant.create(TenantId.parse(this.ids.generate()), command.name, occurredAt)

      await this.tenants.save(tenant)

      const seededRoles = SystemRoleNames.map((name) =>
        Role.createSystemRole(RoleId.parse(this.ids.generate()), tenant.id, name, occurredAt),
      )

      await this.roles.saveMany(seededRoles)

      const ownerRole = seededRoles.find((role) => role.name === 'Owner')
      const adminRole = seededRoles.find((role) => role.name === 'Admin')
      const memberRole = seededRoles.find((role) => role.name === 'Member')

      if (ownerRole === undefined || adminRole === undefined || memberRole === undefined) {
        throw new Error('CreateTenant must seed Owner, Admin, and Member')
      }

      const membership = Membership.createOwner(
        MembershipId.parse(this.ids.generate()),
        tenant.id,
        command.ownerUserId,
        ownerRole.id,
        occurredAt,
      )

      await this.memberships.save(membership)

      return {
        tenantId: tenant.id,
        ownerMembershipId: membership.id,
        roleIds: {
          owner: ownerRole.id,
          admin: adminRole.id,
          member: memberRole.id,
        },
      }
    })
  }
}
