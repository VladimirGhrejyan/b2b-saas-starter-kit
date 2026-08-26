import {describe, expect, it} from 'vitest'

import {HttpMethod} from './http-method'

describe('HttpMethod', () => {
  it('exposes the standard HTTP verbs', () => {
    expect(HttpMethod.GET).toBe('GET')
    expect(HttpMethod.POST).toBe('POST')
    expect(HttpMethod.PUT).toBe('PUT')
    expect(HttpMethod.PATCH).toBe('PATCH')
    expect(HttpMethod.DELETE).toBe('DELETE')
  })
})
