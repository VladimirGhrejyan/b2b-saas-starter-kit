import {describe, expect, it} from 'vitest'

import {RefreshFamilyId, RefreshSessionId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {RefreshSession} from './refresh-session'

const SESSION_ID = RefreshSessionId.parse('11111111-1111-4111-8111-111111111111')
const USER_ID = UserId.parse('22222222-2222-4222-8222-222222222222')
const FAMILY_ID = RefreshFamilyId.parse('33333333-3333-4333-8333-333333333333')
const NOW = new Date('2026-01-01T00:00:00.000Z')
const LATER = new Date('2026-01-02T00:00:00.000Z')

describe('RefreshSession', () => {
  it('is active until revoked or expired', () => {
    const session = RefreshSession.create(SESSION_ID, USER_ID, FAMILY_ID, 'hash', LATER)

    expect(session.isActive(NOW)).toBe(true)

    session.revoke(NOW)

    expect(session.isActive(NOW)).toBe(false)
    expect(session.revokedAt).toEqual(NOW)
  })
})
