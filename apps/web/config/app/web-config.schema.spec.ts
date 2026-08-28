import {webConfigSchema} from './web-config.schema'

describe('webConfigSchema', () => {
  it('accepts an absolute API URL', () => {
    expect(webConfigSchema.parse({apiBaseUrl: 'http://localhost:3000/v1'})).toEqual({
      apiBaseUrl: 'http://localhost:3000/v1',
    })
  })

  it('rejects a missing or invalid API URL', () => {
    expect(() => webConfigSchema.parse({})).toThrow()
    expect(() => webConfigSchema.parse({apiBaseUrl: ''})).toThrow()
    expect(() => webConfigSchema.parse({apiBaseUrl: 'not-a-url'})).toThrow()
    expect(() => webConfigSchema.parse({apiBaseUrl: '/v1'})).toThrow()
  })
})
