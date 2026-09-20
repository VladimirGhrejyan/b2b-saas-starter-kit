import {type TenantActor, TenantActorKind} from '../enums/tenant-actor-kind'
import type {ApiKeyId} from '../ids/api-key-id'

export function apiKeyActor(id: ApiKeyId): TenantActor {
  return {kind: TenantActorKind.apiKey, id}
}
