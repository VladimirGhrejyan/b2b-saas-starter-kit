import {describe, expect, it} from 'vitest'

import {FixedClock} from '../testing/fixed-clock'
import {InMemoryLocalPasswordRepository} from '../testing/in-memory-local-password.repository'
import {InMemoryMailer} from '../testing/in-memory-mailer'
import {InMemoryMembershipRepository} from '../testing/in-memory-membership.repository'
import {InMemoryPasswordHasher} from '../testing/in-memory-password-hasher'
import {InMemoryPasswordResetTokenRepository} from '../testing/in-memory-password-reset-token.repository'
import {InMemoryRefreshSessionRepository} from '../testing/in-memory-refresh-session.repository'
import {InMemoryTokenDigest} from '../testing/in-memory-token-digest'
import {InMemoryUnitOfWork} from '../testing/in-memory-unit-of-work'
import {InMemoryUserRepository} from '../testing/in-memory-user.repository'
import {SequentialIdGenerator} from '../testing/sequential-id-generator'

import {InvalidCredentialsError} from './errors/invalid-credentials.error'
import {InvalidRefreshTokenError} from './errors/invalid-refresh-token.error'
import {InvalidResetTokenError} from './errors/invalid-reset-token.error'
import {LoginUseCase} from './login.use-case'
import {RegisterUserUseCase} from './register-user.use-case'
import {RequestPasswordResetUseCase} from './request-password-reset.use-case'
import {ResetPasswordUseCase} from './reset-password.use-case'
import {RotateRefreshUseCase} from './rotate-refresh.use-case'

const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')

function createHarness() {
  const users = new InMemoryUserRepository()
  const passwords = new InMemoryLocalPasswordRepository()
  const sessions = new InMemoryRefreshSessionRepository()
  const resetTokens = new InMemoryPasswordResetTokenRepository()
  const memberships = new InMemoryMembershipRepository()
  const hasher = new InMemoryPasswordHasher()
  const digest = new InMemoryTokenDigest()
  const mailer = new InMemoryMailer()
  const ids = new SequentialIdGenerator()
  const uow = new InMemoryUnitOfWork(users, passwords, sessions, resetTokens, memberships)
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
  const requestReset = new RequestPasswordResetUseCase(
    uow,
    new FixedClock(OCCURRED_AT),
    ids,
    digest,
    mailer,
    users,
    resetTokens,
  )
  const resetPassword = new ResetPasswordUseCase(
    uow,
    new FixedClock(OCCURRED_AT),
    hasher,
    digest,
    passwords,
    resetTokens,
    sessions,
  )
  const rotate = new RotateRefreshUseCase(uow, new FixedClock(OCCURRED_AT), ids, digest, sessions)

  return {mailer, register, login, requestReset, resetPassword, rotate}
}

function readResetToken(text: string): string {
  return text.replace('reset token: ', '')
}

describe('password reset', () => {
  it('always succeeds for an unknown email and does not send mail', async () => {
    const {mailer, requestReset} = createHarness()

    await expect(requestReset.execute({email: 'missing@example.com'})).resolves.toBeUndefined()
    expect(mailer.messages).toEqual([])
  })

  it('replaces the password and revokes refresh families', async () => {
    const {mailer, register, login, requestReset, resetPassword, rotate} = createHarness()

    await register.execute({email: 'ada@example.com', displayName: 'Ada', password: 'secret-password'})
    const session = await login.execute({email: 'ada@example.com', password: 'secret-password'})

    await requestReset.execute({email: 'Ada@example.com'})

    const rawToken = readResetToken(mailer.messages[0]?.text ?? '')

    await resetPassword.execute({token: rawToken, password: 'new-password'})

    await expect(login.execute({email: 'ada@example.com', password: 'secret-password'})).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    )
    await expect(login.execute({email: 'ada@example.com', password: 'new-password'})).resolves.toMatchObject({
      userId: session.userId,
    })
    await expect(rotate.execute({refreshToken: session.refreshToken})).rejects.toBeInstanceOf(InvalidRefreshTokenError)
  })

  it('rejects an invalid reset token', async () => {
    const {resetPassword} = createHarness()

    await expect(resetPassword.execute({token: 'missing', password: 'new-password'})).rejects.toBeInstanceOf(
      InvalidResetTokenError,
    )
  })
})
