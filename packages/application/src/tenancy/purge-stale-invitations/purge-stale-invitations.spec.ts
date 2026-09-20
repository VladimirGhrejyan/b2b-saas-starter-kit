import {describe, expect, it} from 'vitest'

import {InvitationId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Invitation} from '@b2b-saas-starter-kit/domain'

import {FixedClock} from '../../testing/fixed-clock'
import {InMemoryInvitationRepository} from '../../testing/in-memory-invitation.repository'
import {InMemoryUnitOfWork} from '../../testing/in-memory-unit-of-work'

import {PurgeStaleInvitationsUseCase} from './purge-stale-invitations.use-case'

const NOW = new Date('2026-02-01T00:00:00.000Z')
const tenantId = TenantId.parse('11111111-1111-4111-8111-111111111111')
const actorId = UserId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
const roleId = RoleId.parse('88888888-8888-4888-8888-888888888888')

function invitation(id: string, email: string, expiresAt: Date): Invitation {
  return Invitation.create(InvitationId.parse(id), tenantId, email, [roleId], `hash-${id}`, expiresAt, actorId, NOW)
}

describe('PurgeStaleInvitationsUseCase', () => {
  it('deletes expired and consumed invitations and keeps active ones', async () => {
    const invitations = new InMemoryInvitationRepository()
    const useCase = new PurgeStaleInvitationsUseCase(
      new InMemoryUnitOfWork(invitations),
      new FixedClock(NOW),
      invitations,
    )

    await invitations.save(
      invitation('11111111-1111-4111-8111-111111111111', 'ada@example.com', new Date('2026-03-01T00:00:00.000Z')),
    )
    await invitations.save(
      invitation('22222222-2222-4222-8222-222222222222', 'mel@example.com', new Date('2026-01-01T00:00:00.000Z')),
    )

    const consumed = invitation(
      '33333333-3333-4333-8333-333333333333',
      'eve@example.com',
      new Date('2026-03-01T00:00:00.000Z'),
    )

    consumed.consume(NOW)
    await invitations.save(consumed)

    await expect(useCase.execute()).resolves.toEqual({deleted: 2})
    await expect(
      invitations.findById(InvitationId.parse('11111111-1111-4111-8111-111111111111')),
    ).resolves.toMatchObject({email: 'ada@example.com'})
    await expect(invitations.findById(InvitationId.parse('22222222-2222-4222-8222-222222222222'))).resolves.toBeNull()
    await expect(invitations.findById(InvitationId.parse('33333333-3333-4333-8333-333333333333'))).resolves.toBeNull()
  })
})
