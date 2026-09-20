import type {ApiKeyId} from '../ids/api-key-id'
import type {UserId} from '../ids/user-id'

export const TenantActorKind = {
  user: 'user',
  apiKey: 'api_key',
} as const

export type TenantActorKind = (typeof TenantActorKind)[keyof typeof TenantActorKind]
export type UserActorKind = typeof TenantActorKind.user
export type ApiKeyActorKind = typeof TenantActorKind.apiKey

export type TenantActor =
  {readonly kind: UserActorKind; readonly id: UserId} | {readonly kind: ApiKeyActorKind; readonly id: ApiKeyId}
