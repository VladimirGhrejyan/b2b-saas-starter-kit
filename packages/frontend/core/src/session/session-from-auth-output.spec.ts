import {randomUUID} from 'node:crypto'

import {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {sessionFromAuthOutput} from './session-from-auth-output'

describe('sessionFromAuthOutput', () => {
  it('maps a tenant-scoped session and leaves permissions empty', () => {
    const userId = UserId.parse(randomUUID())
    const tenantId = TenantId.parse(randomUUID())

    expect(
      sessionFromAuthOutput({
        accessToken: 'token',
        expiresIn: 900,
        userId,
        tenantId,
      }),
    ).toEqual({
      accessToken: 'token',
      userId,
      activeTenantId: tenantId,
      effectivePermissions: [],
    })
  })

  it('treats a missing tenant claim as null', () => {
    const userId = UserId.parse(randomUUID())

    expect(
      sessionFromAuthOutput({
        accessToken: 'token',
        expiresIn: 900,
        userId,
      }).activeTenantId,
    ).toBeNull()
  })
})
