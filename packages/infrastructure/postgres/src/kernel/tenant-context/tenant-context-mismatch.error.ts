/**
 * Thrown when a command `tenantId` disagrees with the ambient {@link TenantContext}.
 */
export class TenantContextMismatchError extends Error {
  readonly code = 'TENANT_CONTEXT_MISMATCH'

  constructor() {
    super('command tenantId does not match ambient TenantContext')
    this.name = new.target.name
  }
}
