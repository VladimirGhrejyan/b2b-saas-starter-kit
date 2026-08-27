import {describe, expect, it} from 'vitest'

import {assertDevPrincipalAllowed} from './assert-dev-principal-allowed'

describe('assertDevPrincipalAllowed', () => {
  it('allows non-production environments', () => {
    expect(() => {
      assertDevPrincipalAllowed('development')
    }).not.toThrow()

    expect(() => {
      assertDevPrincipalAllowed('test')
    }).not.toThrow()
  })

  it('refuses production', () => {
    expect(() => {
      assertDevPrincipalAllowed('production')
    }).toThrow('DevPrincipal header-trust must not run in production')
  })
})
