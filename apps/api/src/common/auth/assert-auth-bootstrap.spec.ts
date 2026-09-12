import {describe, expect, it} from 'vitest'

import {assertAuthBootstrap} from './assert-auth-bootstrap'
import {DEV_JWT_ACCESS_SECRET} from './jwt-access.constants'

describe('assertAuthBootstrap', () => {
  it('allows non-production environments with the development secret', () => {
    expect(() => {
      assertAuthBootstrap('development', DEV_JWT_ACCESS_SECRET)
    }).not.toThrow()

    expect(() => {
      assertAuthBootstrap('test', DEV_JWT_ACCESS_SECRET)
    }).not.toThrow()
  })

  it('refuses production with the development secret', () => {
    expect(() => {
      assertAuthBootstrap('production', DEV_JWT_ACCESS_SECRET)
    }).toThrow('JWT_ACCESS_SECRET must not be the development default in production')
  })

  it('allows production with a distinct secret', () => {
    expect(() => {
      assertAuthBootstrap('production', 'production-jwt-access-secret')
    }).not.toThrow()
  })

  it('refuses an empty secret', () => {
    expect(() => {
      assertAuthBootstrap('development', '')
    }).toThrow('JWT_ACCESS_SECRET is required')
  })
})
