import type {TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

/**
 * Builds Redis-ready keys. Tenant keys are prefixed `t:<tenantId>:` so cached
 * state cannot leak across tenants.
 */
export class CacheKey {
  static tenant(tenantId: TenantId, ...segments: string[]): string {
    return ['t', tenantId, ...segments].join(':')
  }

  static global(...segments: string[]): string {
    return ['g', ...segments].join(':')
  }
}
