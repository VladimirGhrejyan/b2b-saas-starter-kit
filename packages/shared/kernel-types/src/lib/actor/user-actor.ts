import {type TenantActor, TenantActorKind} from '../enums/tenant-actor-kind'
import type {UserId} from '../ids/user-id'

export function userActor(id: UserId): TenantActor {
  return {kind: TenantActorKind.user, id}
}
