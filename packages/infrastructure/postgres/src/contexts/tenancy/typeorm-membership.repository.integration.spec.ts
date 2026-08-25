import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {
  MembershipId,
  MembershipStatus,
  RoleId,
  TenantId,
  TenantStatus,
  UserId,
} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Membership, Tenant} from '@b2b-saas-starter-kit/domain'

import {AlsTenantContext} from '../../kernel/tenant-context/tenant-context'
import {TenantContextMismatchError} from '../../kernel/tenant-context/tenant-context-mismatch.error'
import {PostgresTestContext} from '../../testing/postgres-test-context'

import {TypeOrmMembershipRepository} from './typeorm-membership.repository'
import {TypeOrmTenantRepository} from './typeorm-tenant.repository'

const tenantA = TenantId.parse('11111111-1111-4111-8111-111111111111')
const tenantB = TenantId.parse('22222222-2222-4222-8222-222222222222')
const actorA = UserId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
const actorB = UserId.parse('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
const membershipA = MembershipId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1')
const membershipB = MembershipId.parse('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1')
const roleA = RoleId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2')
const roleB = RoleId.parse('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2')

describe('TypeOrmMembershipRepository', () => {
  let ctx: PostgresTestContext
  let tenantContext: AlsTenantContext
  let tenants: TypeOrmTenantRepository
  let repo: TypeOrmMembershipRepository

  beforeAll(async () => {
    ctx = await PostgresTestContext.connect()
    tenantContext = new AlsTenantContext()
    tenants = new TypeOrmTenantRepository(ctx.dataSource, tenantContext)
    repo = new TypeOrmMembershipRepository(ctx.dataSource, tenantContext)
  })

  afterAll(async () => {
    await ctx?.destroy()
  })

  beforeEach(async () => {
    await ctx.truncateFoundationTables()
    await tenantContext.withoutTenantScope(async () => {
      await tenants.save(Tenant.reconstitute({id: tenantA, name: 'Acme', status: TenantStatus.parse('active')}))
      await tenants.save(Tenant.reconstitute({id: tenantB, name: 'Beta', status: TenantStatus.parse('active')}))
    })
  })

  it('round-trips membership role ids through membership_roles', async () => {
    await tenantContext.withoutTenantScope(async () => {
      await repo.save(
        Membership.reconstitute({
          id: membershipA,
          tenantId: tenantA,
          userId: actorA,
          roleIds: [roleA],
          status: MembershipStatus.parse('active'),
        }),
      )
    })

    const found = await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => repo.findById(membershipA))
    const byUser = await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () =>
      repo.findByUserAndTenant(actorA, tenantA),
    )
    const byTenant = await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () =>
      repo.findByTenant(tenantA),
    )

    expect(found?.roleIds).toEqual([roleA])
    expect(byUser?.id).toBe(membershipA)
    expect(byTenant).toHaveLength(1)
  })

  it('does not let tenant A load tenant B memberships', async () => {
    await tenantContext.withoutTenantScope(async () => {
      await repo.save(
        Membership.reconstitute({
          id: membershipB,
          tenantId: tenantB,
          userId: actorB,
          roleIds: [roleB],
          status: MembershipStatus.parse('active'),
        }),
      )
    })

    const byId = await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => repo.findById(membershipB))
    const byTenant = await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () =>
      repo.findByTenant(tenantB),
    )

    expect(byId).toBeNull()
    expect(byTenant).toEqual([])
  })

  it('throws TenantContextMismatchError when ambient tenant disagrees with the aggregate', async () => {
    await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => {
      await expect(
        repo.save(
          Membership.reconstitute({
            id: membershipB,
            tenantId: tenantB,
            userId: actorB,
            roleIds: [roleB],
            status: MembershipStatus.parse('active'),
          }),
        ),
      ).rejects.toBeInstanceOf(TenantContextMismatchError)
    })
  })
})
