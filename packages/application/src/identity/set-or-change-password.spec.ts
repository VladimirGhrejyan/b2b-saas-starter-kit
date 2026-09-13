import {describe, expect, it} from 'vitest'

import {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {UserNotFoundError} from '../shared/errors/user-not-found.error'
import {FixedClock} from '../testing/fixed-clock'
import {InMemoryLocalPasswordRepository} from '../testing/in-memory-local-password.repository'
import {InMemoryMembershipRepository} from '../testing/in-memory-membership.repository'
import {InMemoryPasswordHasher} from '../testing/in-memory-password-hasher'
import {InMemoryRefreshSessionRepository} from '../testing/in-memory-refresh-session.repository'
import {InMemoryTokenDigest} from '../testing/in-memory-token-digest'
import {InMemoryUnitOfWork} from '../testing/in-memory-unit-of-work'
import {InMemoryUserRepository} from '../testing/in-memory-user.repository'
import {SequentialIdGenerator} from '../testing/sequential-id-generator'

import {InvalidCredentialsError} from './errors/invalid-credentials.error'
import {InvalidPasswordError} from './errors/invalid-password.error'
import {InvalidRefreshTokenError} from './errors/invalid-refresh-token.error'
import {PasswordAlreadySetError} from './errors/password-already-set.error'
import {CreateUserUseCase} from './create-user.use-case'
import {LoginUseCase} from './login.use-case'
import {RegisterUserUseCase} from './register-user.use-case'
import {RotateRefreshUseCase} from './rotate-refresh.use-case'
import {SetOrChangePasswordUseCase} from './set-or-change-password.use-case'

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
  const clock = new FixedClock(OCCURRED_AT)
  const createUser = new CreateUserUseCase(uow, clock, ids, users)
  const register = new RegisterUserUseCase(uow, clock, ids, hasher, users, passwords)
  const login = new LoginUseCase(uow, clock, ids, hasher, digest, users, passwords, sessions, memberships)
  const rotate = new RotateRefreshUseCase(uow, clock, ids, digest, sessions)
  const setOrChange = new SetOrChangePasswordUseCase(uow, clock, hasher, users, passwords, sessions)

  return {createUser, register, login, rotate, setOrChange}
}

describe('SetOrChangePasswordUseCase', () => {
  it('sets a password when the user has none', async () => {
    const {createUser, login, setOrChange} = createHarness()
    const created = await createUser.execute({email: 'ada@example.com', displayName: 'Ada'})

    await setOrChange.execute({actorId: created.userId, password: 'secret-password'})

    const session = await login.execute({email: 'ada@example.com', password: 'secret-password'})

    expect(session.userId).toBe(created.userId)
  })

  it('rejects set when currentPassword is sent and no credential exists', async () => {
    const {createUser, setOrChange} = createHarness()
    const created = await createUser.execute({email: 'ada@example.com', displayName: 'Ada'})

    await expect(
      setOrChange.execute({actorId: created.userId, password: 'secret-password', currentPassword: 'nope'}),
    ).rejects.toBeInstanceOf(InvalidCredentialsError)
  })

  it('rejects change without currentPassword when a credential exists', async () => {
    const {register, setOrChange} = createHarness()
    const registered = await register.execute({
      email: 'ada@example.com',
      displayName: 'Ada',
      password: 'secret-password',
    })

    await expect(setOrChange.execute({actorId: registered.userId, password: 'next-password'})).rejects.toBeInstanceOf(
      PasswordAlreadySetError,
    )
  })

  it('changes the password and revokes refresh families', async () => {
    const {register, login, rotate, setOrChange} = createHarness()
    const registered = await register.execute({
      email: 'ada@example.com',
      displayName: 'Ada',
      password: 'secret-password',
    })
    const session = await login.execute({email: 'ada@example.com', password: 'secret-password'})

    await setOrChange.execute({
      actorId: registered.userId,
      password: 'next-password',
      currentPassword: 'secret-password',
    })

    await expect(rotate.execute({refreshToken: session.refreshToken})).rejects.toBeInstanceOf(InvalidRefreshTokenError)
    await expect(login.execute({email: 'ada@example.com', password: 'secret-password'})).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    )

    const next = await login.execute({email: 'ada@example.com', password: 'next-password'})

    expect(next.userId).toBe(registered.userId)
  })

  it('rejects a wrong current password', async () => {
    const {register, setOrChange} = createHarness()
    const registered = await register.execute({
      email: 'ada@example.com',
      displayName: 'Ada',
      password: 'secret-password',
    })

    await expect(
      setOrChange.execute({
        actorId: registered.userId,
        password: 'next-password',
        currentPassword: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError)
  })

  it('rejects a short password', async () => {
    const {createUser, setOrChange} = createHarness()
    const created = await createUser.execute({email: 'ada@example.com', displayName: 'Ada'})

    await expect(setOrChange.execute({actorId: created.userId, password: 'short'})).rejects.toBeInstanceOf(
      InvalidPasswordError,
    )
  })

  it('rejects an unknown actor', async () => {
    const {setOrChange} = createHarness()

    await expect(
      setOrChange.execute({
        actorId: UserId.parse('99999999-9999-4999-8999-999999999999'),
        password: 'secret-password',
      }),
    ).rejects.toBeInstanceOf(UserNotFoundError)
  })
})
