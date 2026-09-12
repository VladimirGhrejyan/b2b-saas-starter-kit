import {describe, expect, it} from 'vitest'

import {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {UuidV7IdGenerator} from './id-generator'

describe('UuidV7IdGenerator', () => {
  it('returns a UUID v7 string that kernel UserId.parse accepts', () => {
    const ids = new UuidV7IdGenerator()
    const value = ids.generate()

    expect(value.charAt(14)).toBe('7')
    expect(UserId.parse(value)).toBe(value)
  })
})
