import {webConfigSchema} from './web-config.schema'

describe('webConfigSchema', () => {
  it('accepts an absolute API URL', () => {
    expect(webConfigSchema.parse({env: 'development', apiBaseUrl: 'http://localhost:3000/v1'})).toEqual({
      env: 'development',
      apiBaseUrl: 'http://localhost:3000/v1',
    })
  })

  it('rejects a missing or invalid API URL', () => {
    expect(() => webConfigSchema.parse({})).toThrow()
    expect(() => webConfigSchema.parse({env: 'development', apiBaseUrl: ''})).toThrow()
    expect(() => webConfigSchema.parse({env: 'development', apiBaseUrl: 'not-a-url'})).toThrow()
    expect(() => webConfigSchema.parse({env: 'development', apiBaseUrl: '/v1'})).toThrow()
  })

  it('rejects a missing or invalid deploy env', () => {
    expect(() => webConfigSchema.parse({apiBaseUrl: 'http://localhost:3000/v1'})).toThrow()
    expect(() => webConfigSchema.parse({env: 'local', apiBaseUrl: 'http://localhost:3000/v1'})).toThrow()
  })
})
