import type {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type JwtAccessConfig = {
  readonly secret: string
  readonly ttlSeconds: number
  readonly issuer: string
  readonly audience: string
  readonly nodeEnv: 'development' | 'test' | 'production'
  readonly cookieSecure: boolean
}

export type JwtAccessClaims = {
  readonly userId: UserId
  readonly tenantId?: TenantId
}
