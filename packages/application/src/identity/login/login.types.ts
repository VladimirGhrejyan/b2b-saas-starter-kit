import type {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type LoginCommand = {
  readonly email: string
  readonly password: string
}

export type LoginResult = {
  readonly userId: UserId
  readonly tenantId?: TenantId
  readonly refreshToken: string
}
