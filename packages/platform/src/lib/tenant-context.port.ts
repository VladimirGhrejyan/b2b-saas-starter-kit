import type {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

/**
 * Active tenant + actor for the current async scope.
 *
 * Edge middleware and workers call `run`. Infrastructure reads the getters.
 * Getters throw `TenantContextNotEstablishedError` when no scope is active.
 */
export type TenantScope = {
  readonly tenantId: TenantId
  readonly actorId: UserId
}

export interface TenantContext {
  run<T>(scope: TenantScope, work: () => Promise<T>): Promise<T>
  getTenantId(): TenantId
  getActorId(): UserId
}
