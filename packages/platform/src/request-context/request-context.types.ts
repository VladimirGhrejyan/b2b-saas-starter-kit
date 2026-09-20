import type {TenantActorKind} from '@b2b-saas-starter-kit/shared-kernel-types'

/**
 * Correlation fields for the current async request (or job) scope.
 *
 * `requestId` is always set when a scope is active. `tenantId` / `actorId` are
 * bound later by auth once the principal is known. `actorKind` distinguishes
 * a user from an API key when `actorId` is set.
 */
export type RequestContext = {
  requestId: string
  tenantId?: string
  actorId?: string
  actorKind?: TenantActorKind
}
