import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {TenantCreatedEvent, UserCreatedEvent} from '@b2b-saas-starter-kit/domain'

import {PostgresTestContext} from '../../testing/postgres-test-context'
import {TypeormUnitOfWork} from '../persistence/unit-of-work'

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

  beforeAll(async () => {
    ctx = await PostgresTestContext.connect()
    uow = new TypeormUnitOfWork(ctx.dataSource)
    publisher = new PostgresEventPublisher()
    relay = new OutboxRelay(ctx.dataSource)
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

  it('claims pending rows as processing and completes them later', async () => {
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

    const claimed = await relay.claimBatch(10)

    expect(claimed).toHaveLength(1)
    expect(claimed[0]?.eventType).toBe('TenantCreated')

    const processing = await ctx.dataSource.getRepository(OutboxEntryEntity).findOneBy({id: claimed[0]?.id})

    expect(processing?.status).toBe(OutboxStatus.parse('processing'))

    await relay.complete(claimed[0]?.id ?? '')

    const stored = await ctx.dataSource.getRepository(OutboxEntryEntity).findOneBy({eventType: 'TenantCreated'})

    expect(stored?.status).toBe(OutboxStatus.parse('processed'))
    expect(stored?.processedAt).toBeInstanceOf(Date)
  })

  it('reclaims stale processing rows back to pending', async () => {
    const occurredAt = new Date('2026-02-01T00:00:00.000Z')

    const staleEvent: TenantCreatedEvent = {
      type: 'TenantCreated',
      occurredAt,
      tenantId,
      name: 'Stale Co',
    }

    await uow.run(async () => {
      await publisher.publish([staleEvent])
    })

    const claimed = await relay.claimBatch(10)

    await ctx.dataSource.query(`UPDATE outbox SET updated_at = $1 WHERE id = $2`, [
      new Date('2026-01-01T00:00:00.000Z'),
      claimed[0]?.id,
    ])

    const reclaimed = await relay.reclaimStaleProcessing(new Date('2026-01-15T00:00:00.000Z'), 10)

    expect(reclaimed).toBe(1)

    const stored = await ctx.dataSource.getRepository(OutboxEntryEntity).findOneBy({eventType: 'TenantCreated'})

    expect(stored?.status).toBe(OutboxStatus.parse('pending'))
  })
})
