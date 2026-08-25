import {Test} from '@nestjs/testing'
import type {DataSource} from 'typeorm'
import {v7 as uuidv7} from 'uuid'
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {SystemClock} from '../kernel/clock/clock'
import {DataSourceManager} from '../kernel/data-source/data-source.manager'
import {PostgresInfrastructureModule} from '../kernel/data-source/postgres-infrastructure.module'
import {TenantAwareRepository} from '../kernel/persistence/tenant-aware.repository'
import {TypeormUnitOfWork} from '../kernel/persistence/unit-of-work'
import {AlsTenantContext} from '../kernel/tenant-context/tenant-context'
import {TenantContextMismatchError} from '../kernel/tenant-context/tenant-context-mismatch.error'
import {CLOCK, DATA_SOURCE} from '../kernel/tokens'

import {InfraProbeRowEntity} from './infra-probe-row.entity'
import {PostgresTestContext} from './postgres-test-context'

const tenantA = TenantId.parse('11111111-1111-4111-8111-111111111111')
const tenantB = TenantId.parse('22222222-2222-4222-8222-222222222222')
const actorA = UserId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
const actorB = UserId.parse('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')

class ProbeRepository extends TenantAwareRepository {
  async insert(name: string): Promise<void> {
    await this.manager.insert(InfraProbeRowEntity, this.stampTenantId({id: uuidv7(), name}))
  }

  async insertWithTenant(name: string, tenantId: string): Promise<void> {
    await this.manager.insert(InfraProbeRowEntity, this.stampTenantId({id: uuidv7(), name, tenantId}))
  }

  async findNames(): Promise<string[]> {
    const rows = await this.scoped(
      'row',
      this.manager.createQueryBuilder(InfraProbeRowEntity, 'row').orderBy('row.name', 'ASC'),
    ).getMany()

    return rows.map((row) => row.name)
  }

  findAllNames(): Promise<string[]> {
    return this.withoutTenantScope(async () => this.findNames())
  }

  rejectIfMismatch(tenantId: TenantId): void {
    this.assertTenant(tenantId)
  }
}

describe('postgres (compose)', () => {
  let ctx: PostgresTestContext
  let tenantContext: AlsTenantContext
  let uow: TypeormUnitOfWork
  let repo: ProbeRepository

  beforeAll(async () => {
    ctx = await PostgresTestContext.connect([InfraProbeRowEntity])
    await ctx.dataSource.query(`
      CREATE TABLE IF NOT EXISTS infra_probe_rows (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL,
        name text NOT NULL
      )
    `)
    tenantContext = new AlsTenantContext()
    uow = new TypeormUnitOfWork(ctx.dataSource)
    repo = new ProbeRepository(ctx.dataSource, tenantContext)
  })

  afterAll(async () => {
    if (ctx?.dataSource.isInitialized) {
      await ctx.dataSource.query('DROP TABLE IF EXISTS infra_probe_rows')
      await ctx.destroy()
    }
  })

  beforeEach(async () => {
    await ctx.dataSource.query('TRUNCATE infra_probe_rows')
  })

  it('connects a DataSource to the test database', () => {
    expect(ctx.dataSource.isInitialized).toBe(true)
  })

  it('filters reads and stamps writes to the ambient tenant', async () => {
    await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => {
      await repo.insert('alpha')
    })
    await tenantContext.run({tenantId: tenantB, actorId: actorB}, async () => {
      await repo.insert('beta')
    })

    const fromA = await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => repo.findNames())
    const fromB = await tenantContext.run({tenantId: tenantB, actorId: actorB}, async () => repo.findNames())

    expect(fromA).toEqual(['alpha'])
    expect(fromB).toEqual(['beta'])
  })

  it('reads both tenants through withoutTenantScope', async () => {
    await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => {
      await repo.insert('alpha')
    })
    await tenantContext.run({tenantId: tenantB, actorId: actorB}, async () => {
      await repo.insert('beta')
    })

    const all = await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => repo.findAllNames())

    expect(all).toEqual(['alpha', 'beta'])
  })

  it('throws TenantContextMismatchError when assertTenant disagrees with ambient scope', async () => {
    await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => {
      expect(() => {
        repo.rejectIfMismatch(tenantB)
      }).toThrow(TenantContextMismatchError)
    })
  })

  it('rolls back both inserts when UnitOfWork work throws', async () => {
    await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => {
      await expect(
        uow.run(async () => {
          await repo.insert('one')
          await repo.insert('two')
          throw new Error('boom')
        }),
      ).rejects.toThrow('boom')
    })

    const names = await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => repo.findNames())

    expect(names).toEqual([])
  })

  it('joins a nested UnitOfWork onto the same transaction', async () => {
    await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => {
      await uow.run(async (outer) => {
        await repo.insert('outer')

        await uow.run(async (inner) => {
          expect(inner.id).toBe(outer.id)
          await repo.insert('inner')
        })
      })
    })

    const names = await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => repo.findNames())

    expect(names).toEqual(['inner', 'outer'])
  })

  it('initializes and destroys DataSourceManager without Nest', async () => {
    const manager = new DataSourceManager(ctx.config)

    await manager.onModuleInit()
    expect(manager.get().isInitialized).toBe(true)

    await manager.onModuleDestroy()
    expect(manager.get().isInitialized).toBe(false)
  })

  it('initializes DATA_SOURCE through PostgresInfrastructureModule.forRootAsync', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PostgresInfrastructureModule.forRootAsync({
          useFactory: () => ctx.config,
        }),
      ],
    }).compile()

    await moduleRef.init()

    try {
      const dataSource = moduleRef.get<DataSource>(DATA_SOURCE)
      const clock = moduleRef.get<SystemClock>(CLOCK)

      expect(dataSource.isInitialized).toBe(true)
      expect(clock.now()).toBeInstanceOf(Date)
    } finally {
      await moduleRef.close()
    }
  })

  it('throws TenantContextMismatchError when a write stamps a different tenant than ambient', async () => {
    await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => {
      await expect(repo.insertWithTenant('x', tenantB)).rejects.toBeInstanceOf(TenantContextMismatchError)
    })
  })

  it('persists row.tenantId when no ambient tenant is set', async () => {
    await repo.insertWithTenant('boot', tenantA)

    const names = await repo.findAllNames()

    expect(names).toEqual(['boot'])
  })
})
