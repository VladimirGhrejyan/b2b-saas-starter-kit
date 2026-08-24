import {describe, expect, it} from 'vitest'

import {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {PermissionCatalog, SystemRoles, User} from '@b2b-saas-starter-kit/domain'

import {FixedClock} from '../testing/fixed-clock'
import {InMemoryMembershipRepository} from '../testing/in-memory-membership.repository'
import {InMemoryRoleRepository} from '../testing/in-memory-role.repository'
import {InMemoryTenantRepository} from '../testing/in-memory-tenant.repository'
import {InMemoryUnitOfWork} from '../testing/in-memory-unit-of-work'
import {InMemoryUserRepository} from '../testing/in-memory-user.repository'
import {SequentialIdGenerator} from '../testing/sequential-id-generator'

import {OwnerUserNotFoundError} from './errors/owner-user-not-found.error'
import {CreateTenantUseCase} from './create-tenant.use-case'

const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')
const OWNER_ID = UserId.parse('11111111-1111-4111-8111-111111111111')
const MISSING_USER = UserId.parse('99999999-9999-4999-8999-999999999999')
const FIRST_GENERATED_TENANT = TenantId.parse('00000000-0000-4000-8000-000000000001')

function createUseCase() {
  const users = new InMemoryUserRepository()
  const tenants = new InMemoryTenantRepository()
  const roles = new InMemoryRoleRepository()
  const memberships = new InMemoryMembershipRepository()
  const createTenant = new CreateTenantUseCase(
    new InMemoryUnitOfWork(users, tenants, roles, memberships),
    new FixedClock(OCCURRED_AT),
    new SequentialIdGenerator(),
    users,
    tenants,
    roles,
    memberships,
  )

  return {users, tenants, roles, memberships, createTenant}
}

describe('CreateTenantUseCase', () => {
  it('seeds tenant, three system roles, and an owner membership in one unit of work', async () => {
    const {users, tenants, roles, memberships, createTenant} = createUseCase()

    await users.save(User.create(OWNER_ID, 'ada@example.com', 'Ada', OCCURRED_AT))

    const result = await createTenant.execute({name: 'Acme', ownerUserId: OWNER_ID})
    const tenant = await tenants.findById(result.tenantId)
    const seeded = await roles.findByTenant(result.tenantId)
    const ownerMembership = await memberships.findById(result.ownerMembershipId)
    const ownerRole = seeded.find((role) => role.id === result.roleIds.owner)
    const adminRole = seeded.find((role) => role.id === result.roleIds.admin)
    const memberRole = seeded.find((role) => role.id === result.roleIds.member)

    expect(tenant?.name).toBe('Acme')
    expect(seeded).toHaveLength(3)
    expect(ownerRole?.isSystem).toBe(true)
    expect(ownerRole?.permissions).toEqual([...SystemRoles.permissionsFor('Owner')])
    expect(adminRole?.permissions).toEqual([...SystemRoles.permissionsFor('Admin')])
    expect(memberRole?.permissions).toEqual([PermissionCatalog.tenancyTenantRead])
    expect(ownerMembership?.userId).toBe(OWNER_ID)
    expect(ownerMembership?.roleIds).toEqual([result.roleIds.owner])
    expect(ownerMembership?.status).toBe('active')
  })

  it('throws and persists nothing when the owner user is missing', async () => {
    const {tenants, roles, memberships, createTenant} = createUseCase()

    await expect(createTenant.execute({name: 'Acme', ownerUserId: MISSING_USER})).rejects.toBeInstanceOf(
      OwnerUserNotFoundError,
    )

    expect(await tenants.findById(FIRST_GENERATED_TENANT)).toBeNull()
    expect(await roles.findByTenant(FIRST_GENERATED_TENANT)).toEqual([])
    expect(await memberships.findByTenant(FIRST_GENERATED_TENANT)).toEqual([])
  })
})
