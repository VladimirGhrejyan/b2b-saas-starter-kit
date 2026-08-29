import {describe, expect, it} from 'vitest'

import {MembershipId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Membership, PermissionCatalog, User} from '@b2b-saas-starter-kit/domain'

import {AuthorizationService} from '../authorization/authorization.service'
import {CreateUserUseCase} from '../identity/create-user.use-case'
import {GetMyProfileQuery} from '../identity/get-my-profile.query'
import {InsufficientPermissionError} from '../shared/errors/insufficient-permission.error'
import {CreateTenantUseCase} from '../tenancy/create-tenant.use-case'
import {ListTenantMembersQuery} from '../tenancy/list-tenant-members.query'
import {MembershipRolesService} from '../tenancy/membership-roles.service'

import {FixedClock} from './fixed-clock'
import {InMemoryCache} from './in-memory-cache'
import {InMemoryMembershipRepository} from './in-memory-membership.repository'
import {InMemoryRoleRepository} from './in-memory-role.repository'
import {InMemoryTenantRepository} from './in-memory-tenant.repository'
import {InMemoryUnitOfWork} from './in-memory-unit-of-work'
import {InMemoryUserRepository} from './in-memory-user.repository'
import {SequentialIdGenerator} from './sequential-id-generator'

const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')
const MEMBER_USER = UserId.parse('22222222-2222-4222-8222-222222222222')
const MEMBER_MEMBERSHIP = MembershipId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
const OTHER_TENANT = TenantId.parse('44444444-4444-4444-8444-444444444444')

function createFlow() {
  const users = new InMemoryUserRepository()
  const tenants = new InMemoryTenantRepository()
  const roles = new InMemoryRoleRepository()
  const memberships = new InMemoryMembershipRepository()
  const uow = new InMemoryUnitOfWork(users, tenants, roles, memberships)
  const clock = new FixedClock(OCCURRED_AT)
  const ids = new SequentialIdGenerator()
  const authz = new AuthorizationService(roles, new MembershipRolesService(memberships), new InMemoryCache())
  const createUser = new CreateUserUseCase(uow, clock, ids, users)
  const createTenant = new CreateTenantUseCase(uow, clock, ids, users, tenants, roles, memberships)
  const listMembers = new ListTenantMembersQuery(authz, memberships)
  const getMyProfile = new GetMyProfileQuery(users, memberships, authz)

  return {users, memberships, createUser, createTenant, listMembers, getMyProfile}
}

describe('application flows', () => {
  it('lets Owner and Admin list members and denies Member, strangers, and other tenants', async () => {
    const {users, memberships, createUser, createTenant, listMembers} = createFlow()
    const owner = await createUser.execute({email: 'ada@example.com', displayName: 'Ada'})
    const tenant = await createTenant.execute({name: 'Acme', ownerUserId: owner.userId})

    await users.save(User.create(MEMBER_USER, 'mel@example.com', 'Mel', OCCURRED_AT))
    await memberships.save(
      Membership.create(MEMBER_MEMBERSHIP, tenant.tenantId, MEMBER_USER, [tenant.roleIds.member], OCCURRED_AT),
    )

    const asOwner = await listMembers.execute({tenantId: tenant.tenantId, actorId: owner.userId})

    expect(asOwner.members).toHaveLength(2)

    const adminUser = User.create(
      UserId.parse('33333333-3333-4333-8333-333333333333'),
      'admin@example.com',
      'Ann',
      OCCURRED_AT,
    )
    const adminMembership = Membership.create(
      MembershipId.parse('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
      tenant.tenantId,
      adminUser.id,
      [tenant.roleIds.admin],
      OCCURRED_AT,
    )

    await users.save(adminUser)
    await memberships.save(adminMembership)

    const asAdmin = await listMembers.execute({tenantId: tenant.tenantId, actorId: adminUser.id})

    expect(asAdmin.members).toHaveLength(3)

    await expect(listMembers.execute({tenantId: tenant.tenantId, actorId: MEMBER_USER})).rejects.toBeInstanceOf(
      InsufficientPermissionError,
    )
    await expect(
      listMembers.execute({
        tenantId: tenant.tenantId,
        actorId: UserId.parse('cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
      }),
    ).rejects.toBeInstanceOf(InsufficientPermissionError)
    await expect(listMembers.execute({tenantId: OTHER_TENANT, actorId: owner.userId})).rejects.toBeInstanceOf(
      InsufficientPermissionError,
    )
  })

  it('returns Owner and Member effective permission sets on GetMyProfile', async () => {
    const {users, memberships, createUser, createTenant, getMyProfile} = createFlow()
    const owner = await createUser.execute({email: 'ada@example.com', displayName: 'Ada'})
    const tenant = await createTenant.execute({name: 'Acme', ownerUserId: owner.userId})

    const ownerProfile = await getMyProfile.execute({actorId: owner.userId, tenantId: tenant.tenantId})

    expect(ownerProfile.effectivePermissions).toEqual([...PermissionCatalog.all])
    expect(ownerProfile.membership?.roleIds).toEqual([tenant.roleIds.owner])

    await users.save(User.create(MEMBER_USER, 'mel@example.com', 'Mel', OCCURRED_AT))
    await memberships.save(
      Membership.create(MEMBER_MEMBERSHIP, tenant.tenantId, MEMBER_USER, [tenant.roleIds.member], OCCURRED_AT),
    )

    const memberProfile = await getMyProfile.execute({actorId: MEMBER_USER, tenantId: tenant.tenantId})

    expect(memberProfile.effectivePermissions).toEqual([PermissionCatalog.tenancyTenantRead])
  })
})
