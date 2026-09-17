import {afterAll, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {TenantCreatedEvent, UserCreatedEvent} from '@b2b-saas-starter-kit/domain'

import {InProcessEventBus} from '@b2b-saas-starter-kit/platform'

import {PostgresTestContext} from '../../testing/postgres-test-context'
import {TypeormUnitOfWork} from '../persistence/unit-of-work'
import {AlsTenantContext} from '../tenant-context/tenant-context'

import {OutboxEntryEntity} from './outbox-entry.entity'
import {OutboxRelay} from './outbox-relay'
import {OutboxStatus} from './outbox-status'
import {PostgresEventPublisher} from './postgres-event-publisher'

const tenantId = TenantId.parse('11111111-1111-4111-8111-111111111111')
const userId = UserId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')

describe('outbox (compose)', () => {
  let ctx: PostgresTestContext
  let uow: TypeormUnitOfWork
  let publisher: PostgresEventPublisher
  let relay: OutboxRelay
  let eventBus: InProcessEventBus

  beforeAll(async () => {
    ctx = await PostgresTestContext.connect()
    uow = new TypeormUnitOfWork(ctx.dataSource)
    publisher = new PostgresEventPublisher()
    eventBus = new InProcessEventBus()
    relay = new OutboxRelay(ctx.dataSource, eventBus, new AlsTenantContext())
  })

  afterAll(async () => {
    await ctx?.destroy()
  })

  beforeEach(async () => {
    await ctx.dataSource.query('TRUNCATE outbox')
  })

  it('commits outbox rows with the domain transaction and rolls back together', async () => {
    const occurredAt = new Date('2026-01-01T00:00:00.000Z')

    const tenantCreatedEvent: TenantCreatedEvent = {
      type: 'TenantCreated',
      occurredAt,
      tenantId,
      name: 'Acme',
    }

    await expect(
      uow.run(async () => {
        await publisher.publish([tenantCreatedEvent])
        throw new Error('rollback')
      }),
    ).rejects.toThrow('rollback')

    const rows = await ctx.dataSource.getRepository(OutboxEntryEntity).find()

    expect(rows).toHaveLength(0)

    const userCreatedEvent: UserCreatedEvent = {
      type: 'UserCreated',
      occurredAt,
      userId,
      email: 'ada@example.com',
    }

    await uow.run(async () => {
      await publisher.publish([userCreatedEvent])
    })

    const committed = await ctx.dataSource.getRepository(OutboxEntryEntity).find()

    expect(committed).toHaveLength(1)
    expect(committed[0]?.eventType).toBe('UserCreated')
    expect(committed[0]?.tenantId).toBeNull()
  })

  it('relays pending rows through the event bus and marks them processed', async () => {
    const handler = vi.fn(async () => undefined)

    eventBus.register('TenantCreated', handler)

    const occurredAt = new Date('2026-02-01T00:00:00.000Z')

    const relayTenantCreatedEvent: TenantCreatedEvent = {
      type: 'TenantCreated',
      occurredAt,
      tenantId,
      name: 'Relay Co',
    }

    await uow.run(async () => {
      await publisher.publish([relayTenantCreatedEvent])
    })

    const processed = await relay.processBatch({batchSize: 10})

    expect(processed).toBe(1)
    expect(handler).toHaveBeenCalledTimes(1)

    const stored = await ctx.dataSource.getRepository(OutboxEntryEntity).findOneBy({eventType: 'TenantCreated'})

    expect(stored?.status).toBe(OutboxStatus.parse('processed'))
    expect(stored?.processedAt).toBeInstanceOf(Date)
  })
})
