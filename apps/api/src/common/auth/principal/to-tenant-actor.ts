import type {TenantActor} from '@b2b-saas-starter-kit/shared-kernel-types'
import {apiKeyActor, TenantActorKind, userActor} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {AuthPrincipal} from './dev-principal.types'

export function toTenantActor(principal: AuthPrincipal): TenantActor {
  if (principal.kind === TenantActorKind.user) {
    return userActor(principal.userId)
  }

  return apiKeyActor(principal.apiKeyId)
}
