import {describe, expect, it} from 'vitest'

import {webConfigSchema} from './web-config.schema'

describe('webConfigSchema', () => {
  it('accepts an absolute API URL and coerces nodeEnv', () => {
    expect(
      webConfigSchema.parse({appEnv: 'development', nodeEnv: 'test', apiBaseUrl: 'http://localhost:3000/v1'}),
    ).toEqual({
      appEnv: 'development',
      nodeEnv: 'development',
      apiBaseUrl: 'http://localhost:3000/v1',
    })
  })

  it('rejects a missing or invalid API URL', () => {
    expect(() => webConfigSchema.parse({})).toThrow()
    expect(() => webConfigSchema.parse({appEnv: 'development', apiBaseUrl: ''})).toThrow()
    expect(() => webConfigSchema.parse({appEnv: 'development', apiBaseUrl: 'not-a-url'})).toThrow()
    expect(() => webConfigSchema.parse({appEnv: 'development', apiBaseUrl: '/v1'})).toThrow()
  })

  it('rejects a missing or invalid appEnv', () => {
    expect(() => webConfigSchema.parse({apiBaseUrl: 'http://localhost:3000/v1'})).toThrow()
    expect(() => webConfigSchema.parse({appEnv: 'local', apiBaseUrl: 'http://localhost:3000/v1'})).toThrow()
  })
})
