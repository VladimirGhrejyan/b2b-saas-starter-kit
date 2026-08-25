import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {TenantId, TenantStatus, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Tenant} from '@b2b-saas-starter-kit/domain'

import {AlsTenantContext} from '../../kernel/tenant-context/tenant-context'
import {TenantContextMismatchError} from '../../kernel/tenant-context/tenant-context-mismatch.error'
import {PostgresTestContext} from '../../testing/postgres-test-context'

import {TypeOrmTenantRepository} from './typeorm-tenant.repository'

const tenantA = TenantId.parse('11111111-1111-4111-8111-111111111111')
const tenantB = TenantId.parse('22222222-2222-4222-8222-222222222222')
const actorA = UserId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')

describe('TypeOrmTenantRepository', () => {
  let ctx: PostgresTestContext
  let tenantContext: AlsTenantContext
  let repo: TypeOrmTenantRepository

  beforeAll(async () => {
    ctx = await PostgresTestContext.connect()
    tenantContext = new AlsTenantContext()
    repo = new TypeOrmTenantRepository(ctx.dataSource, tenantContext)
  })

  afterAll(async () => {
    await ctx?.destroy()
  })

  beforeEach(async () => {
    await ctx.truncateFoundationTables()
  })

  it('round-trips a bootstrap save and ambient-scoped findById', async () => {
    await repo.save(
      Tenant.reconstitute({
        id: tenantA,
        name: 'Acme',
        status: TenantStatus.parse('active'),
      }),
    )

    const found = await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => repo.findById(tenantA))

    expect(found).toMatchObject({id: tenantA, name: 'Acme', status: 'active'})
  })

  it('does not let tenant A load tenant B by id', async () => {
    await repo.save(Tenant.reconstitute({id: tenantA, name: 'Acme', status: TenantStatus.parse('active')}))
    await repo.save(Tenant.reconstitute({id: tenantB, name: 'Beta', status: TenantStatus.parse('active')}))

    const found = await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => repo.findById(tenantB))

    expect(found).toBeNull()
  })

  it('throws TenantContextMismatchError when ambient tenant disagrees with the aggregate', async () => {
    await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => {
      await expect(
        repo.save(Tenant.reconstitute({id: tenantB, name: 'Beta', status: TenantStatus.parse('active')})),
      ).rejects.toBeInstanceOf(TenantContextMismatchError)
    })
  })
})
