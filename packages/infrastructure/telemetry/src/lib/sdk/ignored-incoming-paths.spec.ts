import {describe, expect, it} from 'vitest'

import {IgnoredIncomingPaths} from './ignored-incoming-paths'

describe('IgnoredIncomingPaths', () => {
  it('matches health probes', () => {
    expect(IgnoredIncomingPaths.matches('/live')).toBe(true)
    expect(IgnoredIncomingPaths.matches('/ready?foo=1')).toBe(true)
    expect(IgnoredIncomingPaths.matches('/health')).toBe(true)
  })

  it('matches swagger paths', () => {
    expect(IgnoredIncomingPaths.matches('/docs')).toBe(true)
    expect(IgnoredIncomingPaths.matches('/docs/')).toBe(true)
    expect(IgnoredIncomingPaths.matches('/docs-json')).toBe(true)
  })

  it('matches probes on absolute URLs', () => {
    expect(IgnoredIncomingPaths.matches('http://localhost:3000/ready')).toBe(true)
    expect(IgnoredIncomingPaths.matches('http://localhost:3000/docs-json')).toBe(true)
  })

  it('rejects application routes', () => {
    expect(IgnoredIncomingPaths.matches('/v1/me')).toBe(false)
    expect(IgnoredIncomingPaths.matches(undefined)).toBe(false)
  })
})
