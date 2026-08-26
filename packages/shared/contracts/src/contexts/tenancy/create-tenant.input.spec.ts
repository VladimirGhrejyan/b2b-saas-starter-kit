import {describe, expect, it} from 'vitest'

import {createTenantInputSchema} from './create-tenant.input'

describe('createTenantInputSchema', () => {
  it('parses a non-empty name', () => {
    expect(createTenantInputSchema.parse({name: 'Acme'})).toEqual({name: 'Acme'})
  })

  it('rejects a missing name', () => {
    expect(createTenantInputSchema.safeParse({}).success).toBe(false)
  })
})
