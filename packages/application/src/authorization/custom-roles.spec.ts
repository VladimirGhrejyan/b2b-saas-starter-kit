import {describe, expect, it} from 'vitest'

import {MembershipId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Membership, PermissionCatalog, Role, User} from '@b2b-saas-starter-kit/domain'

import {InsufficientPermissionError} from '../shared/errors/insufficient-permission.error'
import type {MembershipRolesPort} from '../shared/membership-roles.port'
import {FixedClock} from '../testing/fixed-clock'
import {InMemoryCache} from '../testing/in-memory-cache'
import {InMemoryMembershipRepository} from '../testing/in-memory-membership.repository'
import {InMemoryRoleRepository} from '../testing/in-memory-role.repository'
import {InMemoryUnitOfWork} from '../testing/in-memory-unit-of-work'
import {InMemoryUserRepository} from '../testing/in-memory-user.repository'
import {SequentialIdGenerator} from '../testing/sequential-id-generator'

import {AuthorizationService} from './authorization.service'
import {CreateCustomRoleUseCase} from './create-custom-role.use-case'
import {effectivePermissionsCacheKey} from './effective-permissions-cache-key'
import {UpdateCustomRoleUseCase} from './update-custom-role.use-case'

function membershipRolesFrom(memberships: InMemoryMembershipRepository): MembershipRolesPort {
  return {
    async roleIdsFor(userId, tenantId) {
      const membership = await memberships.findByUserAndTenant(userId, tenantId)

      if (membership === null || membership.status !== 'active') {
        return []
      }

      return membership.roleIds
    },
  }
}

const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')
const OWNER_ID = UserId.parse('11111111-1111-4111-8111-111111111111')
const ADMIN_ID = UserId.parse('22222222-2222-4222-8222-222222222222')
const TENANT_ID = TenantId.parse('33333333-3333-4333-8333-333333333333')
const OWNER_ROLE_ID = RoleId.parse('77777777-7777-4777-8777-777777777777')
const ADMIN_ROLE_ID = RoleId.parse('88888888-8888-4888-8888-888888888888')
const CUSTOM_HOLDER = UserId.parse('44444444-4444-4444-8444-444444444444')

async function createHarness() {
  const users = new InMemoryUserRepository()
  const memberships = new InMemoryMembershipRepository()
  const roles = new InMemoryRoleRepository()
  const cache = new InMemoryCache()
  const ids = new SequentialIdGenerator()
  const uow = new InMemoryUnitOfWork(users, memberships, roles)
  const authz = new AuthorizationService(roles, membershipRolesFrom(memberships), cache, memberships)
  const createRole = new CreateCustomRoleUseCase(uow, new FixedClock(OCCURRED_AT), ids, authz, roles)
  const updateRole = new UpdateCustomRoleUseCase(uow, new FixedClock(OCCURRED_AT), authz, roles)

  await users.save(User.create(OWNER_ID, 'owner@example.com', 'Owner', OCCURRED_AT))
  await users.save(User.create(ADMIN_ID, 'admin@example.com', 'Admin', OCCURRED_AT))
  await roles.save(Role.createSystemRole(OWNER_ROLE_ID, TENANT_ID, 'Owner', OCCURRED_AT))
  await roles.save(Role.createSystemRole(ADMIN_ROLE_ID, TENANT_ID, 'Admin', OCCURRED_AT))
  await memberships.save(
    Membership.createOwner(
      MembershipId.parse('55555555-5555-4555-8555-555555555555'),
      TENANT_ID,
      OWNER_ID,
      OWNER_ROLE_ID,
      OCCURRED_AT,
    ),
  )
  await memberships.save(
    Membership.create(
      MembershipId.parse('66666666-6666-4666-8666-666666666666'),
      TENANT_ID,
      ADMIN_ID,
      [ADMIN_ROLE_ID],
      OCCURRED_AT,
    ),
  )

  return {users, memberships, roles, cache, authz, createRole, updateRole}
}

describe('custom roles', () => {
  it('lets Owner create a role and invalidates holders after a permission change', async () => {
    const {users, memberships, cache, authz, createRole, updateRole} = await createHarness()

    const created = await createRole.execute({
      actorId: OWNER_ID,
      tenantId: TENANT_ID,
      name: 'Reviewer',
      permissions: [PermissionCatalog.tenancyTenantRead],
    })

    await users.save(User.create(CUSTOM_HOLDER, 'rev@example.com', 'Rev', OCCURRED_AT))
    await memberships.save(
      Membership.create(
        MembershipId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
        TENANT_ID,
        CUSTOM_HOLDER,
        [created.roleId],
        OCCURRED_AT,
      ),
    )
    await authz.getEffectivePermissions(CUSTOM_HOLDER, TENANT_ID)

    await updateRole.execute({
      actorId: OWNER_ID,
      tenantId: TENANT_ID,
      roleId: created.roleId,
      permissions: [PermissionCatalog.tenancyMembersRead],
    })

    await expect(cache.get(effectivePermissionsCacheKey(TENANT_ID, CUSTOM_HOLDER))).resolves.toBeNull()
    await expect(authz.getEffectivePermissions(CUSTOM_HOLDER, TENANT_ID)).resolves.toEqual([
      PermissionCatalog.tenancyMembersRead,
    ])
  })

  it('denies Admin from creating a custom role', async () => {
    const {createRole} = await createHarness()

    await expect(
      createRole.execute({
        actorId: ADMIN_ID,
        tenantId: TENANT_ID,
        name: 'Reviewer',
        permissions: [PermissionCatalog.tenancyTenantRead],
      }),
    ).rejects.toBeInstanceOf(InsufficientPermissionError)
  })
})
