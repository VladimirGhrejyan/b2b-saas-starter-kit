import type {
  ApiKeyActorKind,
  ApiKeyId,
  TenantId,
  UserActorKind,
  UserId,
} from '@b2b-saas-starter-kit/shared-kernel-types'

export type AuthPrincipal =
  | {
      readonly kind: UserActorKind
      readonly userId: UserId
      readonly tenantId?: TenantId
    }
  | {
      readonly kind: ApiKeyActorKind
      readonly apiKeyId: ApiKeyId
      readonly tenantId: TenantId
    }

export type DevPrincipal = AuthPrincipal
