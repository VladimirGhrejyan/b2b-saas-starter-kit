import type {Span} from '@opentelemetry/api'
import {trace} from '@opentelemetry/api'
import {describe, expect, it, vi} from 'vitest'

import {applyActiveSpanAttributes} from './apply-active-span-attributes'

describe('applyActiveSpanAttributes', () => {
  it('is a no-op without an active span', () => {
    expect(() => {
      applyActiveSpanAttributes({tenantId: 't1'})
    }).not.toThrow()
  })

  it('sets tenant, actor, and request attributes on the active span', () => {
    const setAttribute = vi.fn()
    const span = {setAttribute} as unknown as Span

    vi.spyOn(trace, 'getActiveSpan').mockReturnValue(span)

    applyActiveSpanAttributes({requestId: 'req-1', tenantId: 'tenant-1', actorId: 'user-1'})

    expect(setAttribute).toHaveBeenCalledWith('request.id', 'req-1')
    expect(setAttribute).toHaveBeenCalledWith('tenant.id', 'tenant-1')
    expect(setAttribute).toHaveBeenCalledWith('enduser.id', 'user-1')
    vi.restoreAllMocks()
  })
})
