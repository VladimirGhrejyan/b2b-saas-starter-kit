import {describe, expect, it} from 'vitest'

import {Sha256TokenDigest} from './sha256-token-digest'

describe('Sha256TokenDigest', () => {
  const digest = new Sha256TokenDigest()

  it('round-trips digest and matches', () => {
    const hash = digest.digest('bsk_abcdefghijkl_secret')

    expect(digest.matches('bsk_abcdefghijkl_secret', hash)).toBe(true)
    expect(digest.matches('bsk_abcdefghijkl_other', hash)).toBe(false)
  })

  it('returns false when the stored digest is a different length', () => {
    expect(digest.matches('token', 'ab')).toBe(false)
    expect(digest.matches('token', '')).toBe(false)
  })
})
