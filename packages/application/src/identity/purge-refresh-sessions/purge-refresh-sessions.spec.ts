import {describe, expect, it} from 'vitest'

import {RefreshFamilyId, RefreshSessionId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {RefreshSession} from '@b2b-saas-starter-kit/domain'

import {FixedClock} from '../../testing/fixed-clock'
import {InMemoryRefreshSessionRepository} from '../../testing/in-memory-refresh-session.repository'
import {InMemoryUnitOfWork} from '../../testing/in-memory-unit-of-work'

import {PurgeRefreshSessionsUseCase} from './purge-refresh-sessions.use-case'

const NOW = new Date('2026-02-01T00:00:00.000Z')
const userId = UserId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
const familyId = RefreshFamilyId.parse('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')

describe('PurgeRefreshSessionsUseCase', () => {
  it('deletes expired and revoked sessions and keeps active ones', async () => {
    const sessions = new InMemoryRefreshSessionRepository()
    const useCase = new PurgeRefreshSessionsUseCase(new InMemoryUnitOfWork(sessions), new FixedClock(NOW), sessions)

    await sessions.save(
      RefreshSession.create(
        RefreshSessionId.parse('11111111-1111-4111-8111-111111111111'),
        userId,
        familyId,
        'active-hash',
        new Date('2026-03-01T00:00:00.000Z'),
      ),
    )

    const expired = RefreshSession.create(
      RefreshSessionId.parse('22222222-2222-4222-8222-222222222222'),
      userId,
      familyId,
      'expired-hash',
      new Date('2026-01-01T00:00:00.000Z'),
    )

    await sessions.save(expired)

    const revoked = RefreshSession.create(
      RefreshSessionId.parse('33333333-3333-4333-8333-333333333333'),
      userId,
      familyId,
      'revoked-hash',
      new Date('2026-03-01T00:00:00.000Z'),
    )

    revoked.revoke(NOW)
    await sessions.save(revoked)

    await expect(useCase.execute()).resolves.toEqual({deleted: 2})
    await expect(sessions.findByTokenHash('active-hash')).resolves.toMatchObject({tokenHash: 'active-hash'})
    await expect(sessions.findByTokenHash('expired-hash')).resolves.toBeNull()
    await expect(sessions.findByTokenHash('revoked-hash')).resolves.toBeNull()
  })
})
