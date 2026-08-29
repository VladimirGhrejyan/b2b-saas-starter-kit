import {describe, expect, it} from 'vitest'

import {MembershipId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Membership, PermissionCatalog, Role} from '@b2b-saas-starter-kit/domain'

import {InsufficientPermissionError} from '../shared/errors/insufficient-permission.error'
import type {MembershipRolesPort} from '../shared/membership-roles.port'
import {InMemoryCache} from '../testing/in-memory-cache'
import {InMemoryMembershipRepository} from '../testing/in-memory-membership.repository'
import {InMemoryRoleRepository} from '../testing/in-memory-role.repository'

import {AuthorizationService} from './authorization.service'

const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')
const USER_ID = UserId.parse('11111111-1111-4111-8111-111111111111')
const TENANT_A = TenantId.parse('33333333-3333-4333-8333-333333333333')
const TENANT_B = TenantId.parse('44444444-4444-4444-8444-444444444444')
const OWNER_ROLE_A = RoleId.parse('77777777-7777-4777-8777-777777777777')
const MEMBER_ROLE_A = RoleId.parse('88888888-8888-4888-8888-888888888888')
const MEMBERSHIP_A = MembershipId.parse('55555555-5555-4555-8555-555555555555')
const MEMBERSHIP_SUSPENDED = MembershipId.parse('66666666-6666-4666-8666-666666666666')

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

function createAuthz() {
  const roles = new InMemoryRoleRepository()
  const memberships = new InMemoryMembershipRepository()
  const cache = new InMemoryCache()
  const authz = new AuthorizationService(roles, membershipRolesFrom(memberships), cache)

  return {roles, memberships, cache, authz}
}

describe('AuthorizationService', () => {
  it('unions Owner permissions to the full catalog', async () => {
    const {roles, memberships, authz} = createAuthz()
    const ownerRole = Role.createSystemRole(OWNER_ROLE_A, TENANT_A, 'Owner', OCCURRED_AT)

    await roles.save(ownerRole)
    await memberships.save(Membership.createOwner(MEMBERSHIP_A, TENANT_A, USER_ID, ownerRole.id, OCCURRED_AT))

    const effective = await authz.getEffectivePermissions(USER_ID, TENANT_A)

    expect(effective).toEqual([...PermissionCatalog.all])
  })

  it('returns only tenancy.tenant.read for Member', async () => {
    const {roles, memberships, authz} = createAuthz()
    const memberRole = Role.createSystemRole(MEMBER_ROLE_A, TENANT_A, 'Member', OCCURRED_AT)

    await roles.save(memberRole)
    await memberships.save(Membership.create(MEMBERSHIP_A, TENANT_A, USER_ID, [memberRole.id], OCCURRED_AT))

    const effective = await authz.getEffectivePermissions(USER_ID, TENANT_A)

    expect(effective).toEqual([PermissionCatalog.tenancyTenantRead])
  })

  it('returns no permissions in another tenant', async () => {
    const {roles, memberships, authz} = createAuthz()
    const ownerRole = Role.createSystemRole(OWNER_ROLE_A, TENANT_A, 'Owner', OCCURRED_AT)

    await roles.save(ownerRole)
    await memberships.save(Membership.createOwner(MEMBERSHIP_A, TENANT_A, USER_ID, ownerRole.id, OCCURRED_AT))

    await expect(authz.getEffectivePermissions(USER_ID, TENANT_B)).resolves.toEqual([])
  })

  it('require throws when the permission is missing', async () => {
    const {roles, memberships, authz} = createAuthz()
    const memberRole = Role.createSystemRole(MEMBER_ROLE_A, TENANT_A, 'Member', OCCURRED_AT)

    await roles.save(memberRole)
    await memberships.save(Membership.create(MEMBERSHIP_A, TENANT_A, USER_ID, [memberRole.id], OCCURRED_AT))

    await expect(
      authz.require(USER_ID, PermissionCatalog.tenancyMembersRead, {tenantId: TENANT_A}),
    ).rejects.toBeInstanceOf(InsufficientPermissionError)
  })

  it('ignores a suspended membership', async () => {
    const {roles, memberships, authz} = createAuthz()
    const ownerRole = Role.createSystemRole(OWNER_ROLE_A, TENANT_A, 'Owner', OCCURRED_AT)

    await roles.save(ownerRole)
    await memberships.save(
      Membership.reconstitute({
        id: MEMBERSHIP_SUSPENDED,
        tenantId: TENANT_A,
        userId: USER_ID,
        roleIds: [ownerRole.id],
        status: 'suspended',
      }),
    )

    await expect(authz.getEffectivePermissions(USER_ID, TENANT_A)).resolves.toEqual([])
    await expect(
      authz.require(USER_ID, PermissionCatalog.tenancyMembersRead, {tenantId: TENANT_A}),
    ).rejects.toBeInstanceOf(InsufficientPermissionError)
  })

  it('serves a second getEffectivePermissions from cache without role lookups', async () => {
    const roles = new InMemoryRoleRepository()
    const memberships = new InMemoryMembershipRepository()
    const cache = new InMemoryCache()
    let roleLookups = 0
    const membershipRoles: MembershipRolesPort = {
      async roleIdsFor(userId, tenantId) {
        roleLookups += 1

        return membershipRolesFrom(memberships).roleIdsFor(userId, tenantId)
      },
    }
    const authz = new AuthorizationService(roles, membershipRoles, cache)
    const ownerRole = Role.createSystemRole(OWNER_ROLE_A, TENANT_A, 'Owner', OCCURRED_AT)

    await roles.save(ownerRole)
    await memberships.save(Membership.createOwner(MEMBERSHIP_A, TENANT_A, USER_ID, ownerRole.id, OCCURRED_AT))

    const first = await authz.getEffectivePermissions(USER_ID, TENANT_A)
    const second = await authz.getEffectivePermissions(USER_ID, TENANT_A)

    expect(first).toEqual([...PermissionCatalog.all])
    expect(second).toEqual(first)
    expect(roleLookups).toBe(1)
  })

  it('does not leak tenant A permissions into tenant B', async () => {
    const {roles, memberships, authz} = createAuthz()
    const ownerRole = Role.createSystemRole(OWNER_ROLE_A, TENANT_A, 'Owner', OCCURRED_AT)

    await roles.save(ownerRole)
    await memberships.save(Membership.createOwner(MEMBERSHIP_A, TENANT_A, USER_ID, ownerRole.id, OCCURRED_AT))

    await authz.getEffectivePermissions(USER_ID, TENANT_A)

    await expect(authz.getEffectivePermissions(USER_ID, TENANT_B)).resolves.toEqual([])
  })
})
