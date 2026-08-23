import {describe, expect, it} from 'vitest'

import {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Entity} from './entity'

const ID = UserId.parse('550e8400-e29b-41d4-a716-446655440000')
const OTHER_ID = UserId.parse('6ba7b810-9dad-11d1-80b4-00c04fd430c8')

class TestEntity extends Entity<UserId> {}

describe('Entity', () => {
  it('equals another instance of the same class with the same id', () => {
    const left = new TestEntity(ID)
    const right = new TestEntity(ID)

    expect(left.equals(right)).toBe(true)
    expect(left.equals(left)).toBe(true)
  })

  it('does not equal a different id, a different class, or a nullish value', () => {
    const entity = new TestEntity(ID)
    const otherId = new TestEntity(OTHER_ID)
    const otherClass = new (class OtherEntity extends Entity<UserId> {})(ID)

    expect(entity.equals(otherId)).toBe(false)
    expect(entity.equals(otherClass)).toBe(false)
    expect(entity.equals(null)).toBe(false)
    expect(entity.equals(undefined)).toBe(false)
  })
})
