import {UnauthorizedException} from '@nestjs/common'
import {describe, expect, it} from 'vitest'

import {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {DEV_JWT_ACCESS_SECRET, JWT_ACCESS_TTL_SECONDS, JWT_AUDIENCE, JWT_ISSUER} from './jwt-access.constants'
import {JwtAccessService} from './jwt-access.service'

const USER_ID = UserId.parse('11111111-1111-4111-8111-111111111111')
const TENANT_ID = TenantId.parse('22222222-2222-4222-8222-222222222222')

function createService() {
  return new JwtAccessService({
    secret: DEV_JWT_ACCESS_SECRET,
    ttlSeconds: JWT_ACCESS_TTL_SECONDS,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    nodeEnv: 'test',
    cookieSecure: false,
  })
}

describe('JwtAccessService', () => {
  it('round-trips claims including an optional tenant', async () => {
    const jwt = createService()
    const token = await jwt.sign({userId: USER_ID, tenantId: TENANT_ID})

    await expect(jwt.verify(token)).resolves.toEqual({userId: USER_ID, tenantId: TENANT_ID})
  })

  it('omits tid when the tenant is not selected', async () => {
    const jwt = createService()
    const token = await jwt.sign({userId: USER_ID})

    await expect(jwt.verify(token)).resolves.toEqual({userId: USER_ID})
  })

  it('rejects a tampered token', async () => {
    const jwt = createService()
    const token = await jwt.sign({userId: USER_ID})

    await expect(jwt.verify(`${token}x`)).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
