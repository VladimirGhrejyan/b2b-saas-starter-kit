import type {TenantId, TenantStatus} from '@b2b-saas-starter-kit/shared-kernel-types'

/**
 * Persisted tenant state used by repository adapters. Does not record events.
 */
export type TenantReconstituteProps = {
  readonly id: TenantId
  readonly name: string
  readonly status: TenantStatus
}
