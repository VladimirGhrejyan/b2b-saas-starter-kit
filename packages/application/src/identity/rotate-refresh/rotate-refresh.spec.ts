import {describe, expect, it} from 'vitest'

import {FixedClock} from '../../testing/fixed-clock'
import {InMemoryLocalPasswordRepository} from '../../testing/in-memory-local-password.repository'
import {InMemoryMembershipRepository} from '../../testing/in-memory-membership.repository'
import {InMemoryPasswordHasher} from '../../testing/in-memory-password-hasher'
import {InMemoryRefreshSessionRepository} from '../../testing/in-memory-refresh-session.repository'
import {InMemoryTokenDigest} from '../../testing/in-memory-token-digest'
import {InMemoryUnitOfWork} from '../../testing/in-memory-unit-of-work'
import {InMemoryUserRepository} from '../../testing/in-memory-user.repository'
import {RecordingEventPublisher} from '../../testing/recording-event-publisher'
import {SequentialIdGenerator} from '../../testing/sequential-id-generator'
import {InvalidRefreshTokenError} from '../errors/invalid-refresh-token.error'
import {LoginUseCase} from '../login/login.use-case'
import {RegisterUserUseCase} from '../register-user/register-user.use-case'

import {RotateRefreshUseCase} from './rotate-refresh.use-case'

const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')

function createHarness() {
  const users = new InMemoryUserRepository()
  const passwords = new InMemoryLocalPasswordRepository()
  const sessions = new InMemoryRefreshSessionRepository()
  const memberships = new InMemoryMembershipRepository()
  const hasher = new InMemoryPasswordHasher()
  const digest = new InMemoryTokenDigest()
  const ids = new SequentialIdGenerator()
  const uow = new InMemoryUnitOfWork(users, passwords, sessions, memberships)
  const register = new RegisterUserUseCase(
    uow,
    new FixedClock(OCCURRED_AT),
    ids,
    hasher,
    users,
    passwords,
    new RecordingEventPublisher(),
  )
  const login = new LoginUseCase(
    uow,
    new FixedClock(OCCURRED_AT),
    ids,
    hasher,
    digest,
    users,
    passwords,
    sessions,
    memberships,
  )
  const rotate = new RotateRefreshUseCase(uow, new FixedClock(OCCURRED_AT), ids, digest, sessions)

  return {sessions, digest, register, login, rotate}
}

describe('RotateRefreshUseCase', () => {
  it('rotates an active refresh token', async () => {
    const {register, login, rotate} = createHarness()

    await register.execute({email: 'ada@example.com', displayName: 'Ada', password: 'secret-password'})
    const first = await login.execute({email: 'ada@example.com', password: 'secret-password'})
    const rotated = await rotate.execute({refreshToken: first.refreshToken})

    expect(rotated.userId).toBe(first.userId)
    expect(rotated.refreshToken).not.toBe(first.refreshToken)
  })

  it('revokes the family when a revoked token is reused', async () => {
    const {sessions, digest, register, login, rotate} = createHarness()

    await register.execute({email: 'ada@example.com', displayName: 'Ada', password: 'secret-password'})
    const first = await login.execute({email: 'ada@example.com', password: 'secret-password'})
    const second = await rotate.execute({refreshToken: first.refreshToken})

    await expect(rotate.execute({refreshToken: first.refreshToken})).rejects.toBeInstanceOf(InvalidRefreshTokenError)
    await expect(rotate.execute({refreshToken: second.refreshToken})).rejects.toBeInstanceOf(InvalidRefreshTokenError)

    const reused = await sessions.findByTokenHash(digest.digest(second.refreshToken))

    expect(reused?.revokedAt).toEqual(OCCURRED_AT)
  })

  it('rejects an unknown token', async () => {
    const {rotate} = createHarness()

    await expect(rotate.execute({refreshToken: 'missing'})).rejects.toBeInstanceOf(InvalidRefreshTokenError)
  })
})
