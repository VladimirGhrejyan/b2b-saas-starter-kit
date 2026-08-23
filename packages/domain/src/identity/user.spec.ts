import {describe, expect, it} from 'vitest'

import {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {InvalidUserDisplayNameError} from './errors/invalid-user-display-name.error'
import {InvalidUserEmailError} from './errors/invalid-user-email.error'
import {UserAlreadyActiveError} from './errors/user-already-active.error'
import {UserAlreadySuspendedError} from './errors/user-already-suspended.error'
import {User} from './user'

const USER_ID = UserId.parse('11111111-1111-4111-8111-111111111111')
const OTHER_ID = UserId.parse('22222222-2222-4222-8222-222222222222')
const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')

describe('User', () => {
  it('create records UserCreated, starts active, and normalizes email', () => {
    const user = User.create(USER_ID, '  Ada@Example.COM  ', '  Ada  ', OCCURRED_AT)

    expect(user.email).toBe('ada@example.com')
    expect(user.displayName).toBe('Ada')
    expect(user.status).toBe('active')
    expect(user.pullEvents()).toEqual([
      {
        type: 'UserCreated',
        occurredAt: OCCURRED_AT,
        userId: USER_ID,
        email: 'ada@example.com',
      },
    ])
    expect(user.pullEvents()).toEqual([])
  })

  it('rejects a blank or invalid email and a blank display name', () => {
    expect(() => {
      User.create(USER_ID, '   ', 'Ada', OCCURRED_AT)
    }).toThrow(InvalidUserEmailError)
    expect(() => {
      User.create(USER_ID, 'not-an-email', 'Ada', OCCURRED_AT)
    }).toThrow(InvalidUserEmailError)
    expect(() => {
      User.create(USER_ID, 'ada@example.com', '   ', OCCURRED_AT)
    }).toThrow(InvalidUserDisplayNameError)
  })

  it('suspends and activates, and rejects already-in-state', () => {
    const user = User.create(USER_ID, 'ada@example.com', 'Ada', OCCURRED_AT)

    user.pullEvents()
    user.suspend(OCCURRED_AT)

    expect(user.status).toBe('suspended')
    expect(user.pullEvents()[0]).toMatchObject({type: 'UserSuspended', userId: USER_ID})
    expect(() => {
      user.suspend(OCCURRED_AT)
    }).toThrow(UserAlreadySuspendedError)

    user.activate(OCCURRED_AT)

    expect(user.status).toBe('active')
    expect(user.pullEvents()[0]).toMatchObject({type: 'UserActivated', userId: USER_ID})
    expect(() => {
      user.activate(OCCURRED_AT)
    }).toThrow(UserAlreadyActiveError)
  })

  it('reconstitute does not record events', () => {
    const user = User.reconstitute({
      id: USER_ID,
      email: 'ada@example.com',
      displayName: 'Ada',
      status: 'suspended',
    })

    expect(user.status).toBe('suspended')
    expect(user.pullEvents()).toEqual([])
  })

  it('equals another User with the same id', () => {
    const left = User.reconstitute({
      id: USER_ID,
      email: 'ada@example.com',
      displayName: 'Ada',
      status: 'active',
    })
    const right = User.reconstitute({
      id: USER_ID,
      email: 'other@example.com',
      displayName: 'Other',
      status: 'suspended',
    })
    const other = User.reconstitute({
      id: OTHER_ID,
      email: 'ada@example.com',
      displayName: 'Ada',
      status: 'active',
    })

    expect(left.equals(right)).toBe(true)
    expect(left.equals(other)).toBe(false)
  })
})
