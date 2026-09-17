import {describe, expect, it, vi} from 'vitest'

import {InProcessEventBus} from './in-process-event-bus'

describe('InProcessEventBus', () => {
  it('dispatches registered handlers by event type', async () => {
    const bus = new InProcessEventBus()
    const handler = vi.fn(async () => undefined)

    bus.register('TenantCreated', handler)

    const occurredAt = new Date('2026-01-01T00:00:00.000Z')

    await bus.dispatch([
      {
        type: 'TenantCreated',
        occurredAt,
      },
    ])

    expect(handler).toHaveBeenCalledWith({type: 'TenantCreated', occurredAt})
  })
})
