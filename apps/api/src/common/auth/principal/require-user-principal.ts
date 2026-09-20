import {ForbiddenException} from '@nestjs/common'

import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'
import {TenantActorKind} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {AuthPrincipal} from './dev-principal.types'

export function requireUserPrincipal(principal: AuthPrincipal): UserId {
  if (principal.kind !== TenantActorKind.user) {
    throw new ForbiddenException('user principal is required')
  }

  return principal.userId
}
