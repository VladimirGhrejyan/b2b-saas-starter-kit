import {describe, expect, it} from 'vitest'

import {adminConfigSchema} from './admin-config.schema'

describe('adminConfigSchema', () => {
  it('accepts an absolute API URL and coerces nodeEnv', () => {
    expect(
      adminConfigSchema.parse({appEnv: 'development', nodeEnv: 'test', apiBaseUrl: 'http://localhost:3000/v1'}),
    ).toEqual({
      appEnv: 'development',
      nodeEnv: 'development',
      apiBaseUrl: 'http://localhost:3000/v1',
    })
  })

  it('accepts a same-origin API path', () => {
    expect(adminConfigSchema.parse({appEnv: 'staging', apiBaseUrl: '/api/v1'})).toMatchObject({
      appEnv: 'staging',
      apiBaseUrl: '/api/v1',
    })
  })

  it('rejects a missing or invalid API URL', () => {
    expect(() => adminConfigSchema.parse({})).toThrow()
    expect(() => adminConfigSchema.parse({appEnv: 'development', apiBaseUrl: ''})).toThrow()
    expect(() => adminConfigSchema.parse({appEnv: 'development', apiBaseUrl: 'not-a-url'})).toThrow()
  })

  it('rejects a missing or invalid appEnv', () => {
    expect(() => adminConfigSchema.parse({apiBaseUrl: 'http://localhost:3000/v1'})).toThrow()
    expect(() => adminConfigSchema.parse({appEnv: 'local', apiBaseUrl: 'http://localhost:3000/v1'})).toThrow()
  })
})
