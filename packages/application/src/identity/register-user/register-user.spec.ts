import {describe, expect, it} from 'vitest'

import {FixedClock} from '../../testing/fixed-clock'
import {InMemoryLocalPasswordRepository} from '../../testing/in-memory-local-password.repository'
import {InMemoryPasswordHasher} from '../../testing/in-memory-password-hasher'
import {InMemoryUnitOfWork} from '../../testing/in-memory-unit-of-work'
import {InMemoryUserRepository} from '../../testing/in-memory-user.repository'
import {RecordingEventPublisher} from '../../testing/recording-event-publisher'
import {SequentialIdGenerator} from '../../testing/sequential-id-generator'
import {InvalidPasswordError} from '../errors/invalid-password.error'
import {UserEmailTakenError} from '../errors/user-email-taken.error'

import {RegisterUserUseCase} from './register-user.use-case'

const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')

function createUseCase() {
  const users = new InMemoryUserRepository()
  const passwords = new InMemoryLocalPasswordRepository()
  const hasher = new InMemoryPasswordHasher()
  const useCase = new RegisterUserUseCase(
    new InMemoryUnitOfWork(users, passwords),
    new FixedClock(OCCURRED_AT),
    new SequentialIdGenerator(),
    hasher,
    users,
    passwords,
    new RecordingEventPublisher(),
  )

  return {users, passwords, hasher, useCase}
}

describe('RegisterUserUseCase', () => {
  it('creates a user and a local password without issuing tokens', async () => {
    const {users, passwords, hasher, useCase} = createUseCase()

    const result = await useCase.execute({
      email: '  Ada@Example.COM  ',
      displayName: 'Ada',
      password: 'secret-password',
    })
    const user = await users.findById(result.userId)
    const credential = await passwords.findByUserId(result.userId)

    expect(user?.email).toBe('ada@example.com')
    expect(credential?.passwordHash).toBe(await hasher.hash('secret-password'))
  })

  it('rejects a short password', async () => {
    const {useCase} = createUseCase()

    await expect(
      useCase.execute({email: 'ada@example.com', displayName: 'Ada', password: 'short'}),
    ).rejects.toBeInstanceOf(InvalidPasswordError)
  })

  it('rejects a duplicate email', async () => {
    const {useCase} = createUseCase()

    await useCase.execute({email: 'ada@example.com', displayName: 'Ada', password: 'secret-password'})

    await expect(
      useCase.execute({email: 'ADA@example.com', displayName: 'Other', password: 'other-password'}),
    ).rejects.toBeInstanceOf(UserEmailTakenError)
  })
})
