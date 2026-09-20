import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {PasswordResetToken} from '@b2b-saas-starter-kit/domain'

import {PostgresTestContext} from '../../../testing/postgres-test-context'
import {runInUnitOfWork} from '../../../testing/run-in-unit-of-work'

import {TypeOrmPasswordResetTokenRepository} from './typeorm-password-reset-token.repository'

const activeUser = UserId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
const expiredUser = UserId.parse('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
const consumedUser = UserId.parse('cccccccc-cccc-4ccc-8ccc-cccccccccccc')
const now = new Date('2026-02-01T00:00:00.000Z')

describe('TypeOrmPasswordResetTokenRepository.deleteInactive', () => {
  let ctx: PostgresTestContext
  let repo: TypeOrmPasswordResetTokenRepository

  beforeAll(async () => {
    ctx = await PostgresTestContext.connect()
    repo = new TypeOrmPasswordResetTokenRepository(ctx.dataSource)
  })

  afterAll(async () => {
    await ctx?.destroy()
  })

  beforeEach(async () => {
    await ctx.dataSource.query('TRUNCATE password_reset_tokens RESTART IDENTITY CASCADE')
  })

  it('deletes expired and consumed tokens and keeps active ones', async () => {
    await repo.save(PasswordResetToken.create(activeUser, 'active-hash', new Date('2026-02-01T01:00:00.000Z')))
    await repo.save(PasswordResetToken.create(expiredUser, 'expired-hash', new Date('2026-01-01T00:00:00.000Z')))

    const consumed = PasswordResetToken.create(consumedUser, 'consumed-hash', new Date('2026-02-01T01:00:00.000Z'))

    consumed.consume(now)
    await repo.save(consumed)

    let deleted = 0

    await runInUnitOfWork(ctx.dataSource, async () => {
      deleted = await repo.deleteInactive(now, 500)
    })

    expect(deleted).toBe(2)
    await expect(repo.findByUserId(activeUser)).resolves.toMatchObject({tokenHash: 'active-hash'})
    await expect(repo.findByUserId(expiredUser)).resolves.toBeNull()
    await expect(repo.findByUserId(consumedUser)).resolves.toBeNull()
  })
})
