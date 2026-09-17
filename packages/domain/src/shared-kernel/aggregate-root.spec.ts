import {describe, expect, it} from 'vitest'

import {TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {AggregateRoot} from './aggregate-root'
import type {DomainEventBase} from './domain-event-base'

const TENANT_ID = TenantId.parse('550e8400-e29b-41d4-a716-446655440000')

type TestEvent = DomainEventBase<'TenantRenamed'> & {
  readonly tenantId: typeof TENANT_ID
  readonly name: string
}

class TestAggregate extends AggregateRoot<TenantId, TestEvent> {
  rename(name: string, occurredAt: Date): void {
    this.record({
      type: 'TenantRenamed',
      occurredAt,
      tenantId: this.id,
      name,
    })
  }
}

describe('AggregateRoot', () => {
  it('collects recorded events and drains them on pullEvents', () => {
    const aggregate = new TestAggregate(TENANT_ID)
    const occurredAt = new Date('2026-01-01T00:00:00.000Z')

    aggregate.rename('Acme', occurredAt)

    const events = aggregate.pullEvents()
    const expected: TestEvent = {
      type: 'TenantRenamed',
      occurredAt,
      tenantId: TENANT_ID,
      name: 'Acme',
    }

    expect(events).toEqual([expected])
    expect(aggregate.pullEvents()).toEqual([])
  })
})
