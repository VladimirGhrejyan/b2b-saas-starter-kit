import {describe, expect, it} from 'vitest'

import {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {PasswordResetToken} from '@b2b-saas-starter-kit/domain'

import {FixedClock} from '../../testing/fixed-clock'
import {InMemoryPasswordResetTokenRepository} from '../../testing/in-memory-password-reset-token.repository'
import {InMemoryUnitOfWork} from '../../testing/in-memory-unit-of-work'

import {PurgePasswordResetTokensUseCase} from './purge-password-reset-tokens.use-case'

const NOW = new Date('2026-02-01T00:00:00.000Z')
const activeUser = UserId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
const expiredUser = UserId.parse('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
const consumedUser = UserId.parse('cccccccc-cccc-4ccc-8ccc-cccccccccccc')

describe('PurgePasswordResetTokensUseCase', () => {
  it('deletes expired and consumed tokens and keeps active ones', async () => {
    const tokens = new InMemoryPasswordResetTokenRepository()
    const useCase = new PurgePasswordResetTokensUseCase(new InMemoryUnitOfWork(tokens), new FixedClock(NOW), tokens)

    await tokens.save(PasswordResetToken.create(activeUser, 'active-hash', new Date('2026-02-01T01:00:00.000Z')))
    await tokens.save(PasswordResetToken.create(expiredUser, 'expired-hash', new Date('2026-01-01T00:00:00.000Z')))

    const consumed = PasswordResetToken.create(consumedUser, 'consumed-hash', new Date('2026-02-01T01:00:00.000Z'))

    consumed.consume(NOW)
    await tokens.save(consumed)

    await expect(useCase.execute()).resolves.toEqual({deleted: 2})
    await expect(tokens.findByUserId(activeUser)).resolves.toMatchObject({tokenHash: 'active-hash'})
    await expect(tokens.findByUserId(expiredUser)).resolves.toBeNull()
    await expect(tokens.findByUserId(consumedUser)).resolves.toBeNull()
  })
})
