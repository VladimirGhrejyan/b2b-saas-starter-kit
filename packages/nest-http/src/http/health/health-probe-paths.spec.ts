import {describe, expect, it} from 'vitest'

import {HealthProbePaths} from './health-probe-paths'

describe('HealthProbePaths', () => {
  it('matches unversioned probe paths', () => {
    expect(HealthProbePaths.matches('/live')).toBe(true)
    expect(HealthProbePaths.matches('/ready')).toBe(true)
    expect(HealthProbePaths.matches('/health?foo=1')).toBe(true)
  })

  it('matches prefixed probe paths', () => {
    expect(HealthProbePaths.matches('/api/ready')).toBe(true)
  })

  it('rejects other paths', () => {
    expect(HealthProbePaths.matches('/v1/me')).toBe(false)
    expect(HealthProbePaths.matches('/docs')).toBe(false)
  })
})
