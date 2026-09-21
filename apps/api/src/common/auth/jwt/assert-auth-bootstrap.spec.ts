import {describe, expect, it} from 'vitest'

import {assertAuthBootstrap} from './assert-auth-bootstrap'
import {DEV_JWT_ACCESS_SECRET} from './jwt-access.constants'

describe('assertAuthBootstrap', () => {
  it('allows local development with the development secret', () => {
    expect(() => {
      assertAuthBootstrap({
        nodeEnv: 'development',
        appEnv: 'development',
        jwtAccessSecret: DEV_JWT_ACCESS_SECRET,
        corsOrigins: [],
      })
    }).not.toThrow()
  })

  it('refuses production nodeEnv with the development secret', () => {
    expect(() => {
      assertAuthBootstrap({
        nodeEnv: 'production',
        appEnv: 'staging',
        jwtAccessSecret: DEV_JWT_ACCESS_SECRET,
        corsOrigins: ['https://app.example.com'],
      })
    }).toThrow('JWT_ACCESS_SECRET must not be the development default in production or staging')
  })

  it('refuses staging appEnv with the development secret even when nodeEnv is development', () => {
    expect(() => {
      assertAuthBootstrap({
        nodeEnv: 'development',
        appEnv: 'staging',
        jwtAccessSecret: DEV_JWT_ACCESS_SECRET,
        corsOrigins: ['https://app.example.com'],
      })
    }).toThrow('JWT_ACCESS_SECRET must not be the development default in production or staging')
  })

  it('allows production with a distinct secret and CORS origins', () => {
    expect(() => {
      assertAuthBootstrap({
        nodeEnv: 'production',
        appEnv: 'production',
        jwtAccessSecret: 'production-jwt-access-secret',
        corsOrigins: ['https://app.example.com'],
      })
    }).not.toThrow()
  })

  it('refuses an empty secret', () => {
    expect(() => {
      assertAuthBootstrap({
        nodeEnv: 'development',
        appEnv: 'development',
        jwtAccessSecret: '',
        corsOrigins: [],
      })
    }).toThrow('JWT_ACCESS_SECRET is required')
  })

  it('requires CORS origins when appEnv is not development', () => {
    expect(() => {
      assertAuthBootstrap({
        nodeEnv: 'production',
        appEnv: 'staging',
        jwtAccessSecret: 'production-jwt-access-secret',
        corsOrigins: [],
      })
    }).toThrow('http.cors.origins must be non-empty when appEnv is not development')
  })
})
