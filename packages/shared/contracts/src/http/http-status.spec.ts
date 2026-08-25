import {describe, expect, it} from 'vitest'

import {HttpStatus} from './http-status'

describe('HttpStatus', () => {
  it('includes 403 and 409', () => {
    expect(HttpStatus.FORBIDDEN).toBe(403)
    expect(HttpStatus.CONFLICT).toBe(409)
  })
})
