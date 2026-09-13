import {isAuthSessionUrl} from './is-auth-session-url'

describe('isAuthSessionUrl', () => {
  it('matches the cookie login and refresh paths', () => {
    expect(isAuthSessionUrl('/auth/web/login')).toBe(true)
    expect(isAuthSessionUrl({url: 'auth/web/refresh', method: 'POST'})).toBe(true)
  })

  it('leaves product routes to the 401 refresh loop', () => {
    expect(isAuthSessionUrl('/me')).toBe(false)
    expect(isAuthSessionUrl({url: '/tenants/1/members'})).toBe(false)
  })
})
