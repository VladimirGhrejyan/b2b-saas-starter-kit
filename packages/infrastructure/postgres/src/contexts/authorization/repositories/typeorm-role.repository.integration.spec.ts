import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {Permission, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {PermissionCatalog, Role} from '@b2b-saas-starter-kit/domain'

import {AlsTenantContext} from '../../../kernel/tenant-context/tenant-context'
import {TenantContextMismatchError} from '../../../kernel/tenant-context/tenant-context-mismatch.error'
import {PostgresTestContext} from '../../../testing/postgres-test-context'
import {runInUnitOfWork} from '../../../testing/run-in-unit-of-work'

import {TypeOrmRoleRepository} from './typeorm-role.repository'

const tenantA = TenantId.parse('11111111-1111-4111-8111-111111111111')
const tenantB = TenantId.parse('22222222-2222-4222-8222-222222222222')
const actorA = UserId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
const ownerA = RoleId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1')
const memberA = RoleId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2')
const ownerB = RoleId.parse('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1')

describe('TypeOrmRoleRepository', () => {
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

  it('round-trips save and saveMany including permissions', async () => {
    await tenantContext.withoutTenantScope(async () => {
      await runInUnitOfWork(ctx.dataSource, async () => {
        await repo.save(
          Role.reconstitute({
            id: ownerA,
            tenantId: tenantA,
            name: 'Owner',
            permissions: PermissionCatalog.all,
            isSystem: true,
          }),
        )
        await repo.saveMany([
          Role.reconstitute({
            id: memberA,
            tenantId: tenantA,
            name: 'Member',
            permissions: [PermissionCatalog.tenancyTenantRead],
            isSystem: true,
          }),
        ])
      })
    })

    const found = await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => repo.findById(ownerA))
    const byTenant = await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () =>
      repo.findByTenant(tenantA),
    )

    expect(found?.permissions).toEqual([...PermissionCatalog.all])
    expect(byTenant.map((role) => role.name)).toEqual(['Member', 'Owner'])
    expect(found?.hasPermission(Permission.parse('tenancy.members.read'))).toBe(true)
  })

  it('finds roles by ids in one query and omits missing and other-tenant ids', async () => {
    const missing = RoleId.parse('99999999-9999-4999-8999-999999999999')

    await tenantContext.withoutTenantScope(async () => {
      await runInUnitOfWork(ctx.dataSource, async () => {
        await repo.save(
          Role.reconstitute({
            id: ownerA,
            tenantId: tenantA,
            name: 'Owner',
            permissions: PermissionCatalog.all,
            isSystem: true,
          }),
        )
        await repo.save(
          Role.reconstitute({
            id: memberA,
            tenantId: tenantA,
            name: 'Member',
            permissions: [PermissionCatalog.tenancyTenantRead],
            isSystem: true,
          }),
        )
        await repo.save(
          Role.reconstitute({
            id: ownerB,
            tenantId: tenantB,
            name: 'Owner',
            permissions: PermissionCatalog.all,
            isSystem: true,
          }),
        )
      })
    })

    const found = await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () =>
      repo.findByIds([ownerA, memberA, ownerB, missing]),
    )
    const empty = await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => repo.findByIds([]))

    expect(found.map((role) => role.id).sort()).toEqual([ownerA, memberA].sort())
    expect(empty).toEqual([])
  })

  it('does not let tenant A load tenant B roles', async () => {
    await tenantContext.withoutTenantScope(async () => {
      await runInUnitOfWork(ctx.dataSource, async () => {
        await repo.save(
          Role.reconstitute({
            id: ownerB,
            tenantId: tenantB,
            name: 'Owner',
            permissions: PermissionCatalog.all,
            isSystem: true,
          }),
        )
      })
    })

    const byId = await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => repo.findById(ownerB))

    await expect(
      tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => repo.findByTenant(tenantB)),
    ).rejects.toBeInstanceOf(TenantContextMismatchError)

    expect(byId).toBeNull()
  })

  it('throws TenantContextMismatchError when ambient tenant disagrees with the aggregate', async () => {
    await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => {
      await expect(
        runInUnitOfWork(ctx.dataSource, async () => {
          await repo.save(
            Role.reconstitute({
              id: ownerB,
              tenantId: tenantB,
              name: 'Owner',
              permissions: PermissionCatalog.all,
              isSystem: true,
            }),
          )
        }),
      ).rejects.toBeInstanceOf(TenantContextMismatchError)
    })
  })
})
