import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {IdempotencyClaimKind} from '@b2b-saas-starter-kit/platform'

import {PostgresTestContext} from '../../testing/postgres-test-context'
import {TypeormUnitOfWork} from '../persistence/unit-of-work'

import {IdempotencyKeyEntity} from './idempotency-key.entity'
import {IdempotencyOutsideTransactionError} from './idempotency-outside-transaction.error'
import {PostgresIdempotencyStore} from './postgres-idempotency.store'

const actorId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const scope = `u:${actorId}`

describe('PostgresIdempotencyStore (compose)', () => {
  let ctx: PostgresTestContext
  let uow: TypeormUnitOfWork
  let store: PostgresIdempotencyStore

  beforeAll(async () => {
    ctx = await PostgresTestContext.connect()
    uow = new TypeormUnitOfWork(ctx.dataSource)
    store = new PostgresIdempotencyStore()
  })

  afterAll(async () => {
    await ctx?.destroy()
  })

  beforeEach(async () => {
    await ctx.dataSource.query('TRUNCATE idempotency_keys')
  })

  it('requires an ambient UnitOfWork', async () => {
    await expect(claim(store, {key: 'k1', fingerprint: 'fp-a'})).rejects.toBeInstanceOf(
      IdempotencyOutsideTransactionError,
    )
  })

  it('commits the claim with the unit of work and rolls back together', async () => {
    await expect(
      uow.run(async () => {
        await claim(store, {key: 'k1', fingerprint: 'fp-a'})
        throw new Error('rollback')
      }),
    ).rejects.toThrow('rollback')

    expect(await ctx.dataSource.getRepository(IdempotencyKeyEntity).find()).toHaveLength(0)

    await uow.run(async () => {
      await claim(store, {key: 'k1', fingerprint: 'fp-a'})
      await store.complete({
        scope,
        endpoint: 'POST /tenants',
        key: 'k1',
        statusCode: 201,
        body: {id: 'tenant-1'},
      })
    })

    const rows = await ctx.dataSource.getRepository(IdempotencyKeyEntity).find()

    expect(rows).toHaveLength(1)
    expect(rows[0]?.status).toBe('completed')
    expect(rows[0]?.responseStatus).toBe(201)
    expect(rows[0]?.responseBody).toEqual({id: 'tenant-1'})
    expect(rows[0]?.actorId).toBe(actorId)
  })

  it('replays a completed claim with the same fingerprint', async () => {
    await uow.run(async () => {
      await claim(store, {key: 'k1', fingerprint: 'fp-a'})
      await store.complete({
        scope,
        endpoint: 'POST /tenants',
        key: 'k1',
        statusCode: 201,
        body: {id: 'tenant-1'},
      })
    })

    const replayed = await uow.run(async () => claim(store, {key: 'k1', fingerprint: 'fp-a'}))

    expect(replayed).toEqual({kind: IdempotencyClaimKind.Replay, statusCode: 201, body: {id: 'tenant-1'}})
  })

  it('rejects the same key with a different fingerprint', async () => {
    await uow.run(async () => {
      await claim(store, {key: 'k1', fingerprint: 'fp-a'})
      await store.complete({
        scope,
        endpoint: 'POST /tenants',
        key: 'k1',
        statusCode: 201,
        body: {id: 'tenant-1'},
      })
    })

    const mismatched = await uow.run(async () => claim(store, {key: 'k1', fingerprint: 'fp-b'}))

    expect(mismatched).toEqual({kind: IdempotencyClaimKind.FingerprintMismatch})
  })

  it('returns inFlight when a concurrent claim waits past lock_timeout', async () => {
    let release!: () => void
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    let blocking!: () => void
    const blocked = new Promise<void>((resolve) => {
      blocking = resolve
    })

    const first = uow.run(async () => {
      await claim(store, {key: 'k1', fingerprint: 'fp-a'})
      blocking()
      await held
    })

    await blocked

    const second = uow.run(async () => claim(store, {key: 'k1', fingerprint: 'fp-a'}))

    await expect(second).resolves.toEqual({kind: IdempotencyClaimKind.InFlight})
    release()
    await first
  }, 10_000)
})

async function claim(
  store: PostgresIdempotencyStore,
  input: {key: string; fingerprint: string},
): Promise<Awaited<ReturnType<PostgresIdempotencyStore['claim']>>> {
  return store.claim({
    scope,
    endpoint: 'POST /tenants',
    key: input.key,
    fingerprint: input.fingerprint,
    expiresAt: new Date('2026-01-02T00:00:00.000Z'),
  })
}
