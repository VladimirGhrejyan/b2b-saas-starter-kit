import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {RefreshFamilyId, RefreshSessionId, UserId, UserStatus} from '@b2b-saas-starter-kit/shared-kernel-types'

import {LocalPassword, RefreshSession, User} from '@b2b-saas-starter-kit/domain'

import {Argon2PasswordHasher, Sha256TokenDigest} from '@b2b-saas-starter-kit/security'

import {PostgresTestContext} from '../../../testing/postgres-test-context'

import {TypeOrmLocalPasswordRepository} from './typeorm-local-password.repository'
import {TypeOrmRefreshSessionRepository} from './typeorm-refresh-session.repository'
import {TypeOrmUserRepository} from './typeorm-user.repository'

const adaId = UserId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')

describe('identity credentials persistence', () => {
  let ctx: PostgresTestContext
  let users: TypeOrmUserRepository
  let passwords: TypeOrmLocalPasswordRepository
  let sessions: TypeOrmRefreshSessionRepository

  beforeAll(async () => {
    ctx = await PostgresTestContext.connect()
    users = new TypeOrmUserRepository(ctx.dataSource)
    passwords = new TypeOrmLocalPasswordRepository(ctx.dataSource)
    sessions = new TypeOrmRefreshSessionRepository(ctx.dataSource)
  })

  afterAll(async () => {
    await ctx?.destroy()
  })

  beforeEach(async () => {
    await ctx.truncateFoundationTables()
  })

  it('stores password and refresh secrets as hashes', async () => {
    const hasher = new Argon2PasswordHasher()
    const digest = new Sha256TokenDigest()

    await users.save(
      User.reconstitute({
        id: adaId,
        email: 'ada@example.com',
        displayName: 'Ada',
        status: UserStatus.parse('active'),
      }),
    )

    const passwordHash = await hasher.hash('secret-password')

    await passwords.save(LocalPassword.create(adaId, passwordHash))

    const storedPassword = await passwords.findByUserId(adaId)
    const passwordRows: Array<{password_hash: string}> = await ctx.dataSource.query(
      'SELECT password_hash FROM user_local_passwords WHERE user_id = $1',
      [adaId],
    )

    expect(storedPassword?.passwordHash).toBe(passwordHash)
    expect(passwordRows[0]?.password_hash).not.toContain('secret-password')
    await expect(hasher.verify('secret-password', storedPassword?.passwordHash ?? '')).resolves.toBe(true)

    const refreshToken = 'opaque-refresh-token'
    const session = RefreshSession.create(
      RefreshSessionId.parse('cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
      adaId,
      RefreshFamilyId.parse('dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
      digest.digest(refreshToken),
      new Date('2026-02-01T00:00:00.000Z'),
    )

    await sessions.save(session)

    const storedSession = await sessions.findByTokenHash(digest.digest(refreshToken))
    const sessionRows: Array<{token_hash: string}> = await ctx.dataSource.query(
      'SELECT token_hash FROM refresh_sessions WHERE id = $1',
      [session.id],
    )

    expect(storedSession?.userId).toBe(adaId)
    expect(sessionRows[0]?.token_hash).not.toBe(refreshToken)
    expect(sessionRows[0]?.token_hash).toBe(digest.digest(refreshToken))
  })
})
