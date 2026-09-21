import {HttpStatus} from '@b2b-saas-starter-kit/contracts'

import {forbiddenError, invalidCredentialsError, ownerMe, ownerMembers, unauthorizedError} from './fixtures'
import {FrontendMsw} from './frontend-msw'

describe('FrontendMsw', () => {
  describe('default base URL', () => {
    const msw = new FrontendMsw()

    beforeAll(() => {
      msw.listen()
    })

    afterEach(() => {
      msw.reset()
    })

    afterAll(() => {
      msw.close()
    })

    it('serves owner me and members on http://web.test/v1', async () => {
      msw.useOwner()

      const me = await fetch('http://web.test/v1/me')
      const members = await fetch('http://web.test/v1/tenants/33333333-3333-4333-8333-333333333333/members')

      expect(me.ok).toBe(true)
      expect(await me.json()).toEqual(ownerMe)
      expect(members.ok).toBe(true)
      expect(await members.json()).toEqual(ownerMembers)
    })

    it('serves INVALID_CREDENTIALS on login', async () => {
      msw.useInvalidLogin()

      const response = await fetch('http://web.test/v1/auth/web/login', {method: 'POST'})

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
      expect(await response.json()).toEqual(invalidCredentialsError)
    })

    it('serves UNAUTHORIZED on me', async () => {
      msw.useUnauthorized()

      const response = await fetch('http://web.test/v1/me')

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
      expect(await response.json()).toEqual(unauthorizedError)
    })

    it('serves INSUFFICIENT_PERMISSION on members', async () => {
      msw.useForbiddenMembers()

      const response = await fetch('http://web.test/v1/tenants/33333333-3333-4333-8333-333333333333/members')

      expect(response.status).toBe(HttpStatus.FORBIDDEN)
      expect(await response.json()).toEqual(forbiddenError)
    })
  })

  describe('custom base URL', () => {
    const msw = new FrontendMsw('http://admin.test/v1')

    beforeAll(() => {
      msw.listen()
    })

    afterEach(() => {
      msw.reset()
    })

    afterAll(() => {
      msw.close()
    })

    it('serves owner me on the configured origin', async () => {
      msw.useOwner()

      const response = await fetch('http://admin.test/v1/me')

      expect(response.ok).toBe(true)
      expect(await response.json()).toEqual(ownerMe)
    })
  })
})
