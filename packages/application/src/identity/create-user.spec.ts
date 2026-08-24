import {describe, expect, it} from 'vitest'

import {FixedClock} from '../testing/fixed-clock'
import {InMemoryUnitOfWork} from '../testing/in-memory-unit-of-work'
import {InMemoryUserRepository} from '../testing/in-memory-user.repository'
import {SequentialIdGenerator} from '../testing/sequential-id-generator'

import {UserEmailTakenError} from './errors/user-email-taken.error'
import {CreateUserUseCase} from './create-user.use-case'

const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')

function createUseCase() {
  const users = new InMemoryUserRepository()
  const useCase = new CreateUserUseCase(
    new InMemoryUnitOfWork(users),
    new FixedClock(OCCURRED_AT),
    new SequentialIdGenerator(),
    users,
  )

  return {users, useCase}
}

describe('CreateUserUseCase', () => {
  it('creates a user and normalizes email via the domain', async () => {
    const {users, useCase} = createUseCase()

    const result = await useCase.execute({email: '  Ada@Example.COM  ', displayName: '  Ada  '})
    const user = await users.findById(result.userId)

    expect(user?.email).toBe('ada@example.com')
    expect(user?.displayName).toBe('Ada')
    expect(user?.status).toBe('active')
  })

  it('rejects a duplicate email', async () => {
    const {useCase} = createUseCase()

    await useCase.execute({email: 'ada@example.com', displayName: 'Ada'})

    await expect(useCase.execute({email: 'ADA@example.com', displayName: 'Other'})).rejects.toBeInstanceOf(
      UserEmailTakenError,
    )
  })
})
