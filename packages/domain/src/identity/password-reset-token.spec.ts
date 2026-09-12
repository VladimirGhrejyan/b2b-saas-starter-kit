import {describe, expect, it} from 'vitest'

import {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {PasswordResetToken} from './password-reset-token'

const USER_ID = UserId.parse('22222222-2222-4222-8222-222222222222')
const NOW = new Date('2026-01-01T00:00:00.000Z')
const LATER = new Date('2026-01-02T00:00:00.000Z')

describe('PasswordResetToken', () => {
  it('is active until consumed or expired', () => {
    const token = PasswordResetToken.create(USER_ID, 'hash', LATER)

    expect(token.isActive(NOW)).toBe(true)

    token.consume(NOW)

    expect(token.isActive(NOW)).toBe(false)
    expect(token.consumedAt).toEqual(NOW)
  })
})
