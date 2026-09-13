import {describe, expect, it} from 'vitest'

import {FixedClock} from '../../testing/fixed-clock'
import {InMemoryLocalPasswordRepository} from '../../testing/in-memory-local-password.repository'
import {InMemoryMembershipRepository} from '../../testing/in-memory-membership.repository'
import {InMemoryPasswordHasher} from '../../testing/in-memory-password-hasher'
import {InMemoryRefreshSessionRepository} from '../../testing/in-memory-refresh-session.repository'
import {InMemoryTokenDigest} from '../../testing/in-memory-token-digest'
import {InMemoryUnitOfWork} from '../../testing/in-memory-unit-of-work'
import {InMemoryUserRepository} from '../../testing/in-memory-user.repository'
import {SequentialIdGenerator} from '../../testing/sequential-id-generator'
import {LoginUseCase} from '../login/login.use-case'
import {RegisterUserUseCase} from '../register-user/register-user.use-case'
import {RotateRefreshUseCase} from '../rotate-refresh/rotate-refresh.use-case'

import {LogoutUseCase} from './logout.use-case'

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
  const register = new RegisterUserUseCase(uow, new FixedClock(OCCURRED_AT), ids, hasher, users, passwords)
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
  const logout = new LogoutUseCase(uow, new FixedClock(OCCURRED_AT), digest, sessions)
  const rotate = new RotateRefreshUseCase(uow, new FixedClock(OCCURRED_AT), ids, digest, sessions)

  return {sessions, digest, register, login, logout, rotate}
}

describe('LogoutUseCase', () => {
  it('revokes the refresh family', async () => {
    const {sessions, digest, register, login, logout, rotate} = createHarness()

    await register.execute({email: 'ada@example.com', displayName: 'Ada', password: 'secret-password'})
    const first = await login.execute({email: 'ada@example.com', password: 'secret-password'})

    await logout.execute({refreshToken: first.refreshToken})

    const stored = await sessions.findByTokenHash(digest.digest(first.refreshToken))

    expect(stored?.revokedAt).toEqual(OCCURRED_AT)
    await expect(rotate.execute({refreshToken: first.refreshToken})).rejects.toThrow()
  })

  it('succeeds when the cookie is missing', async () => {
    const {logout} = createHarness()

    await expect(logout.execute({})).resolves.toBeUndefined()
  })
})
