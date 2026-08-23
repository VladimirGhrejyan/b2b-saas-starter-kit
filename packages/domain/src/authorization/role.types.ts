import type {Permission, RoleId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

/**
 * Persisted role state used by repository adapters. Does not record events.
 */
export type RoleReconstituteProps = {
  readonly id: RoleId
  readonly tenantId: TenantId
  readonly name: string
  readonly permissions: readonly Permission[]
  readonly isSystem: boolean
}
