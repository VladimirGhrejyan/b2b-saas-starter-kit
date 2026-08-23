/**
 * Thrown by `TenantContext` getters when no async scope is active.
 */
export class TenantContextNotEstablishedError extends Error {
  readonly code = 'TENANT_CONTEXT_NOT_ESTABLISHED'

  constructor() {
    super('TenantContext is not established')
    this.name = new.target.name
  }
}
