/**
 * Correlation fields for the current async request (or job) scope.
 *
 * `requestId` is always set when a scope is active. `tenantId` / `actorId` are
 * bound later by auth once the principal is known.
 */
export type RequestContext = {
  requestId: string
  tenantId?: string
  actorId?: string
}
