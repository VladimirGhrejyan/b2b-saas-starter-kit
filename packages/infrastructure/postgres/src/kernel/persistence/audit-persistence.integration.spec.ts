import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {Permission, RoleId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {PermissionCatalog, Role} from '@b2b-saas-starter-kit/domain'

import {RoleEntity} from '../../contexts/authorization/entities/role.entity'
import {TypeOrmRoleRepository} from '../../contexts/authorization/repositories/typeorm-role.repository'
import {PostgresTestContext} from '../../testing/postgres-test-context'
import {runInUnitOfWork} from '../../testing/run-in-unit-of-work'
import {AlsTenantContext} from '../tenant-context/tenant-context'

import {AmbientTransactionRequiredError} from './ambient-transaction-required.error'

const tenantA = TenantId.parse('11111111-1111-4111-8111-111111111111')
const roleId = RoleId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1')

describe('audit and version persistence', () => {
  let ctx: PostgresTestContext
  let tenantContext: AlsTenantContext
  let repo: TypeOrmRoleRepository

  beforeAll(async () => {
    ctx = await PostgresTestContext.connect()
    tenantContext = new AlsTenantContext()
    repo = new TypeOrmRoleRepository(ctx.dataSource, tenantContext)
  })

  afterAll(async () => {
    await ctx?.destroy()
  })

  beforeEach(async () => {
    await ctx.truncateFoundationTables()
  })

  it('sets created_at and updated_at when saving a versioned aggregate', async () => {
    await tenantContext.withoutTenantScope(async () => {
      await runInUnitOfWork(ctx.dataSource, async () => {
        await repo.save(
          Role.reconstitute({
            id: roleId,
            tenantId: tenantA,
            name: 'Owner',
            permissions: PermissionCatalog.all,
            isSystem: true,
          }),
        )
      })
    })

    const row = await ctx.dataSource.getRepository(RoleEntity).findOneBy({id: roleId})

    expect(row?.createdAt).toBeInstanceOf(Date)
    expect(row?.updatedAt).toBeInstanceOf(Date)
    expect(row?.version).toBe(1)
  })

  it('requires an ambient transaction for child-collection saves', async () => {
    await tenantContext.withoutTenantScope(async () => {
      await expect(
        repo.save(
          Role.reconstitute({
            id: roleId,
            tenantId: tenantA,
            name: 'Owner',
            permissions: [Permission.parse('tenancy.tenant.read')],
            isSystem: false,
          }),
        ),
      ).rejects.toBeInstanceOf(AmbientTransactionRequiredError)
    })
  })

  it('increments version when updating a versioned aggregate', async () => {
    const occurredAt = new Date('2026-01-01T00:00:00.000Z')

    await tenantContext.withoutTenantScope(async () => {
      await runInUnitOfWork(ctx.dataSource, async () => {
        await repo.save(
          Role.reconstitute({
            id: roleId,
            tenantId: tenantA,
            name: 'Owner',
            permissions: [Permission.parse('tenancy.tenant.read')],
            isSystem: false,
          }),
        )
      })
    })

    const loaded = await tenantContext.withoutTenantScope(async () => repo.findById(roleId))

    if (loaded === null) {
      throw new Error('expected role')
    }

    loaded.rename('Owner updated', occurredAt)

    await tenantContext.withoutTenantScope(async () => {
      await runInUnitOfWork(ctx.dataSource, async () => {
        await repo.save(loaded)
      })
    })

    const row = await ctx.dataSource.getRepository(RoleEntity).findOneBy({id: roleId})

    expect(row?.version).toBe(2)
  })
})
