import {describe, expect, it} from 'vitest'

import {RequestContextLocator} from './request-context.locator'
import type {RequestContext} from './request-context.types'

describe('RequestContextLocator', () => {
  it('returns undefined outside a scope', () => {
    expect(RequestContextLocator.get()).toBeUndefined()
  })

  it('exposes the store established by run', async () => {
    const store = {requestId: 'req-1'}

    await RequestContextLocator.run(store, async () => {
      expect(RequestContextLocator.get()).toBe(store)
      expect(RequestContextLocator.get()?.requestId).toBe('req-1')
    })

    expect(RequestContextLocator.get()).toBeUndefined()
  })

  it('bind mutates the same store object', async () => {
    const store: RequestContext = {requestId: 'req-1'}

    await RequestContextLocator.run(store, async () => {
      RequestContextLocator.bind({actorId: 'user-1', tenantId: 'tenant-1'})

      expect(store.actorId).toBe('user-1')
      expect(store.tenantId).toBe('tenant-1')
      expect(RequestContextLocator.get()).toBe(store)
    })
  })

  it('bind is a no-op outside a scope', () => {
    expect(() => {
      RequestContextLocator.bind({actorId: 'user-1'})
    }).not.toThrow()

    expect(RequestContextLocator.get()).toBeUndefined()
  })

  it('restores the outer store after a nested run', async () => {
    const outer = {requestId: 'outer'}
    const inner = {requestId: 'inner'}

    await RequestContextLocator.run(outer, async () => {
      await RequestContextLocator.run(inner, async () => {
        expect(RequestContextLocator.get()?.requestId).toBe('inner')
      })

      expect(RequestContextLocator.get()?.requestId).toBe('outer')
    })
  })

  it('does not leak concurrent run scopes', async () => {
    const seen: string[] = []

    await Promise.all([
      RequestContextLocator.run({requestId: 'a'}, async () => {
        await delay(30)
        seen.push(RequestContextLocator.get()?.requestId ?? '')
      }),
      RequestContextLocator.run({requestId: 'b'}, async () => {
        seen.push(RequestContextLocator.get()?.requestId ?? '')
      }),
    ])

    expect(seen).toEqual(['b', 'a'])
  })
})

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
