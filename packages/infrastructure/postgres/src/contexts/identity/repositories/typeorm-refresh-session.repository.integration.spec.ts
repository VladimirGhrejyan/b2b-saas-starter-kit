import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {RefreshFamilyId, RefreshSessionId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {RefreshSession} from '@b2b-saas-starter-kit/domain'

import {PostgresTestContext} from '../../../testing/postgres-test-context'
import {runInUnitOfWork} from '../../../testing/run-in-unit-of-work'

import {TypeOrmRefreshSessionRepository} from './typeorm-refresh-session.repository'

const userId = UserId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
const familyId = RefreshFamilyId.parse('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
const now = new Date('2026-02-01T00:00:00.000Z')

describe('TypeOrmRefreshSessionRepository.deleteExpiredOrRevoked', () => {
  let ctx: PostgresTestContext
  let repo: TypeOrmRefreshSessionRepository

  beforeAll(async () => {
    ctx = await PostgresTestContext.connect()
    repo = new TypeOrmRefreshSessionRepository(ctx.dataSource)
  })

  afterAll(async () => {
    await ctx?.destroy()
  })

  beforeEach(async () => {
    await ctx.dataSource.query('TRUNCATE refresh_sessions RESTART IDENTITY CASCADE')
  })

  it('deletes expired and revoked rows and keeps active ones', async () => {
    await repo.save(
      RefreshSession.create(
        RefreshSessionId.parse('11111111-1111-4111-8111-111111111111'),
        userId,
        familyId,
        'active-hash',
        new Date('2026-03-01T00:00:00.000Z'),
      ),
    )
    await repo.save(
      RefreshSession.create(
        RefreshSessionId.parse('22222222-2222-4222-8222-222222222222'),
        userId,
        familyId,
        'expired-hash',
        new Date('2026-01-01T00:00:00.000Z'),
      ),
    )

    const revoked = RefreshSession.create(
      RefreshSessionId.parse('33333333-3333-4333-8333-333333333333'),
      userId,
      familyId,
      'revoked-hash',
      new Date('2026-03-01T00:00:00.000Z'),
    )

    revoked.revoke(now)
    await repo.save(revoked)

    let deleted = 0

    await runInUnitOfWork(ctx.dataSource, async () => {
      deleted = await repo.deleteExpiredOrRevoked(now, 500)
    })

    expect(deleted).toBe(2)
    await expect(repo.findByTokenHash('active-hash')).resolves.toMatchObject({tokenHash: 'active-hash'})
    await expect(repo.findByTokenHash('expired-hash')).resolves.toBeNull()
    await expect(repo.findByTokenHash('revoked-hash')).resolves.toBeNull()
  })
})
