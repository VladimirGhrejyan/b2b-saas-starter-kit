import {describe, expect, it} from 'vitest'

import {ApiKeyToken} from './api-key-token'

describe('ApiKeyToken', () => {
  it('creates, parses, and rejects malformed tokens', () => {
    const token = ApiKeyToken.create('abcdefghijkl', 'secret')

    expect(ApiKeyToken.isApiKeyToken(token)).toBe(true)
    expect(ApiKeyToken.parse(token)).toEqual({prefix: 'bsk_abcdefghijkl'})
    expect(ApiKeyToken.parse('bsk_short_secret')).toBeUndefined()
    expect(ApiKeyToken.parse('not-a-key')).toBeUndefined()
    expect(ApiKeyToken.isApiKeyToken('eyJhbGciOi')).toBe(false)
  })

  it('compacts a UUID to a 12-character public prefix', () => {
    expect(ApiKeyToken.compactId('550e8400-e29b-41d4-a716-446655440000')).toBe('550e8400e29b')
  })
})
