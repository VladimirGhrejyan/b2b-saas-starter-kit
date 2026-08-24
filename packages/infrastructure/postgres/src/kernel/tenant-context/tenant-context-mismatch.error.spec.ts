import {describe, expect, it} from 'vitest'

import {TenantContextMismatchError} from './tenant-context-mismatch.error'

describe('TenantContextMismatchError', () => {
  it('is an Error with a stable code', () => {
    const error = new TenantContextMismatchError()

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(TenantContextMismatchError)
    expect(error.code).toBe('TENANT_CONTEXT_MISMATCH')
    expect(error.name).toBe('TenantContextMismatchError')
  })
})
