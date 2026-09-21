import {describe, expect, it, vi} from 'vitest'

import {InProcessEventBus} from './in-process-event-bus'

describe('InProcessEventBus', () => {
  const occurredAt = new Date('2026-01-01T00:00:00.000Z')
  const tenantCreated = {type: 'TenantCreated', occurredAt}
  const apiKeyCreated = {type: 'ApiKeyCreated', occurredAt}

  it('dispatches registered handlers by event type', async () => {
    const bus = new InProcessEventBus()
    const handler = vi.fn(async () => undefined)

    bus.register('TenantCreated', handler)

    await bus.dispatch([tenantCreated])

    expect(handler).toHaveBeenCalledWith(tenantCreated)
  })

  it('runs catch-all handlers for unregistered event types', async () => {
    const bus = new InProcessEventBus()
    const catchAll = vi.fn(async () => undefined)

    bus.registerAll(catchAll)

    await bus.dispatch([apiKeyCreated])

    expect(catchAll).toHaveBeenCalledWith(apiKeyCreated)
  })

  it('runs typed handlers before catch-all handlers on the same event', async () => {
    const bus = new InProcessEventBus()
    const order: string[] = []
    const typed = vi.fn(async () => {
      order.push('typed')
    })
    const catchAll = vi.fn(async () => {
      order.push('catch-all')
    })

    bus.register('TenantCreated', typed)
    bus.registerAll(catchAll)

    await bus.dispatch([tenantCreated])

    expect(typed).toHaveBeenCalledWith(tenantCreated)
    expect(catchAll).toHaveBeenCalledWith(tenantCreated)
    expect(order).toEqual(['typed', 'catch-all'])
  })
})
