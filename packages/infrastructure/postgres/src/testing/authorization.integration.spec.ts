import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {MembershipId, MembershipStatus, UserId, UserStatus} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Membership, PermissionCatalog, User} from '@b2b-saas-starter-kit/domain'

import {
  AuthorizationService,
  CreateTenantUseCase,
  CreateUserUseCase,
  MembershipRolesService,
} from '@b2b-saas-starter-kit/application'

import {TypeOrmRoleRepository} from '../contexts/authorization/typeorm-role.repository'
import {TypeOrmUserRepository} from '../contexts/identity/typeorm-user.repository'
import {TypeOrmMembershipRepository} from '../contexts/tenancy/typeorm-membership.repository'
import {TypeOrmTenantRepository} from '../contexts/tenancy/typeorm-tenant.repository'
import {SystemClock} from '../kernel/clock/clock'
import {UuidV7IdGenerator} from '../kernel/id-generator/id-generator'
import {TypeormUnitOfWork} from '../kernel/persistence/unit-of-work'
import {AlsTenantContext} from '../kernel/tenant-context/tenant-context'

import {PostgresTestContext} from './postgres-test-context'

const MEMBER_USER = UserId.parse('22222222-2222-4222-8222-222222222222')
const MEMBER_MEMBERSHIP = MembershipId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')

describe('AuthorizationService through TypeORM repositories', () => {
  let ctx: PostgresTestContext
  let tenantContext: AlsTenantContext
  let users: TypeOrmUserRepository
  let memberships: TypeOrmMembershipRepository
  let createUser: CreateUserUseCase
  let createTenant: CreateTenantUseCase
  let authz: AuthorizationService

  beforeAll(async () => {
    ctx = await PostgresTestContext.connect()
    tenantContext = new AlsTenantContext()
    users = new TypeOrmUserRepository(ctx.dataSource)
    const tenants = new TypeOrmTenantRepository(ctx.dataSource, tenantContext)
    const roles = new TypeOrmRoleRepository(ctx.dataSource, tenantContext)

    memberships = new TypeOrmMembershipRepository(ctx.dataSource, tenantContext)
    const uow = new TypeormUnitOfWork(ctx.dataSource)
    const clock = new SystemClock()
    const ids = new UuidV7IdGenerator()

    createUser = new CreateUserUseCase(uow, clock, ids, users)
    createTenant = new CreateTenantUseCase(uow, clock, ids, users, tenants, roles, memberships)
    authz = new AuthorizationService(roles, new MembershipRolesService(memberships))
  })

  afterAll(async () => {
    await ctx?.destroy()
  })

  beforeEach(async () => {
    await ctx.truncateFoundationTables()
  })

  it('gives Owner tenancy.members.read and a Member membership only tenant.read', async () => {
    const owner = await createUser.execute({email: 'ada@example.com', displayName: 'Ada'})
    const tenant = await tenantContext.withoutTenantScope(() =>
      createTenant.execute({name: 'Acme', ownerUserId: owner.userId}),
    )

    await users.save(
      User.reconstitute({
        id: MEMBER_USER,
        email: 'mel@example.com',
        displayName: 'Mel',
        status: UserStatus.parse('active'),
      }),
    )
    await tenantContext.run({tenantId: tenant.tenantId, actorId: owner.userId}, async () => {
      await memberships.save(
        Membership.reconstitute({
          id: MEMBER_MEMBERSHIP,
          tenantId: tenant.tenantId,
          userId: MEMBER_USER,
          roleIds: [tenant.roleIds.member],
          status: MembershipStatus.parse('active'),
        }),
      )
    })

    const ownerPermissions = await tenantContext.run({tenantId: tenant.tenantId, actorId: owner.userId}, async () =>
      authz.getEffectivePermissions(owner.userId, tenant.tenantId),
    )
    const memberPermissions = await tenantContext.run({tenantId: tenant.tenantId, actorId: MEMBER_USER}, async () =>
      authz.getEffectivePermissions(MEMBER_USER, tenant.tenantId),
    )

    expect(ownerPermissions).toContain(PermissionCatalog.tenancyMembersRead)
    expect(memberPermissions).toEqual([PermissionCatalog.tenancyTenantRead])
    expect(memberPermissions).not.toContain(PermissionCatalog.tenancyMembersRead)
  })
})
