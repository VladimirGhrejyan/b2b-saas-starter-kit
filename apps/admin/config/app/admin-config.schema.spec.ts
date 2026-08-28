import {adminConfigSchema} from './admin-config.schema'

describe('adminConfigSchema', () => {
  it('accepts an absolute API URL', () => {
    expect(adminConfigSchema.parse({env: 'development', apiBaseUrl: 'http://localhost:3000/v1'})).toEqual({
      env: 'development',
      apiBaseUrl: 'http://localhost:3000/v1',
    })
  })

  it('rejects a missing or invalid API URL', () => {
    expect(() => adminConfigSchema.parse({})).toThrow()
    expect(() => adminConfigSchema.parse({env: 'development', apiBaseUrl: ''})).toThrow()
    expect(() => adminConfigSchema.parse({env: 'development', apiBaseUrl: 'not-a-url'})).toThrow()
    expect(() => adminConfigSchema.parse({env: 'development', apiBaseUrl: '/v1'})).toThrow()
  })

  it('rejects a missing or invalid deploy env', () => {
    expect(() => adminConfigSchema.parse({apiBaseUrl: 'http://localhost:3000/v1'})).toThrow()
    expect(() => adminConfigSchema.parse({env: 'local', apiBaseUrl: 'http://localhost:3000/v1'})).toThrow()
  })
})
