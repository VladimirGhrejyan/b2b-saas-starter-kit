import {describe, expect, it} from 'vitest'

import {TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {CacheKey} from './cache-key'

const TENANT = TenantId.parse('33333333-3333-4333-8333-333333333333')

describe('CacheKey', () => {
  it('prefixes tenant keys with t:<tenantId>', () => {
    expect(CacheKey.tenant(TENANT, 'authorization', 'effective-permissions', 'user-1')).toBe(
      `t:${TENANT}:authorization:effective-permissions:user-1`,
    )
  })

  it('prefixes global keys with g:', () => {
    expect(CacheKey.global('rate-limit', 'ip', '1.2.3.4')).toBe('g:rate-limit:ip:1.2.3.4')
  })
})
