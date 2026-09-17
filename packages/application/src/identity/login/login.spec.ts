import {describe, expect, it} from 'vitest'

import {MembershipId, RoleId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Membership} from '@b2b-saas-starter-kit/domain'

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
import {InvalidCredentialsError} from '../errors/invalid-credentials.error'
import {UserSuspendedError} from '../errors/user-suspended.error'
import {RegisterUserUseCase} from '../register-user/register-user.use-case'

import {LoginUseCase} from './login.use-case'

const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')
const SECOND_TENANT = TenantId.parse('22222222-2222-4222-8222-222222222222')
const ROLE_ID = RoleId.parse('33333333-3333-4333-8333-333333333333')
const MEMBERSHIP_ONE = MembershipId.parse('44444444-4444-4444-8444-444444444444')
const MEMBERSHIP_TWO = MembershipId.parse('55555555-5555-4555-8555-555555555555')

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

  return {users, passwords, sessions, memberships, digest, register, login}
}

describe('LoginUseCase', () => {
  it('issues a refresh token and omits tenantId when the user has no memberships', async () => {
    const {register, login} = createHarness()

    await register.execute({email: 'ada@example.com', displayName: 'Ada', password: 'secret-password'})

    const result = await login.execute({email: 'Ada@example.com', password: 'secret-password'})

    expect(result.tenantId).toBeUndefined()
    expect(result.refreshToken).toBeTruthy()
  })

  it('returns tenantId when the user has exactly one active membership', async () => {
    const {register, login, memberships} = createHarness()
    const {userId} = await register.execute({
      email: 'ada@example.com',
      displayName: 'Ada',
      password: 'secret-password',
    })
    const tenantId = TenantId.parse('11111111-1111-4111-8111-111111111111')

    await memberships.save(Membership.create(MEMBERSHIP_ONE, tenantId, userId, [ROLE_ID], OCCURRED_AT))

    const result = await login.execute({email: 'ada@example.com', password: 'secret-password'})

    expect(result.tenantId).toBe(tenantId)
  })

  it('omits tenantId when the user has more than one active membership', async () => {
    const {register, login, memberships} = createHarness()
    const {userId} = await register.execute({
      email: 'ada@example.com',
      displayName: 'Ada',
      password: 'secret-password',
    })

    await memberships.save(
      Membership.create(
        MEMBERSHIP_ONE,
        TenantId.parse('11111111-1111-4111-8111-111111111111'),
        userId,
        [ROLE_ID],
        OCCURRED_AT,
      ),
    )
    await memberships.save(Membership.create(MEMBERSHIP_TWO, SECOND_TENANT, userId, [ROLE_ID], OCCURRED_AT))

    const result = await login.execute({email: 'ada@example.com', password: 'secret-password'})

    expect(result.tenantId).toBeUndefined()
  })

  it('rejects a wrong password', async () => {
    const {register, login} = createHarness()

    await register.execute({email: 'ada@example.com', displayName: 'Ada', password: 'secret-password'})

    await expect(login.execute({email: 'ada@example.com', password: 'wrong-password'})).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    )
  })

  it('rejects an unknown email', async () => {
    const {login} = createHarness()

    await expect(login.execute({email: 'missing@example.com', password: 'secret-password'})).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    )
  })

  it('rejects a suspended user', async () => {
    const {users, register, login} = createHarness()
    const {userId} = await register.execute({
      email: 'ada@example.com',
      displayName: 'Ada',
      password: 'secret-password',
    })
    const user = await users.findById(userId)

    if (user === null) {
      throw new Error('expected registered user')
    }

    user.suspend(OCCURRED_AT)
    await users.save(user)

    await expect(login.execute({email: 'ada@example.com', password: 'secret-password'})).rejects.toBeInstanceOf(
      UserSuspendedError,
    )
  })
})
