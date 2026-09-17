import {describe, expect, it} from 'vitest'

import {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {TenantCreatedEvent, UserCreatedEvent} from '@b2b-saas-starter-kit/domain'

import {OutboxSerializer} from './outbox.serializer'

describe('OutboxSerializer', () => {
  it('round-trips occurredAt through JSON storage', () => {
    const occurredAt = new Date('2026-01-01T00:00:00.000Z')
    const event: TenantCreatedEvent = {
      type: 'TenantCreated',
      occurredAt,
      tenantId: TenantId.parse('11111111-1111-4111-8111-111111111111'),
      name: 'Acme',
    }

    const serialized = OutboxSerializer.serialize(event)
    const restored = OutboxSerializer.deserialize(serialized)

    expect(restored).toEqual(event)
    expect(restored.occurredAt).toBeInstanceOf(Date)
  })

  it('extracts tenantId when present on the payload', () => {
    const tenantId = TenantId.parse('11111111-1111-4111-8111-111111111111')

    const userCreated: UserCreatedEvent = {
      type: 'UserCreated',
      occurredAt: new Date(),
      userId: UserId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
      email: 'ada@example.com',
    }

    expect(OutboxSerializer.extractTenantId(userCreated)).toBeNull()

    const tenantCreated: TenantCreatedEvent = {
      type: 'TenantCreated',
      occurredAt: new Date(),
      tenantId,
      name: 'Acme',
    }

    expect(OutboxSerializer.extractTenantId(tenantCreated)).toBe(tenantId)
  })
})
