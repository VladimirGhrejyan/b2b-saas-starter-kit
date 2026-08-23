import {DomainError} from '../../shared-kernel/domain-error'

/**
 * Thrown when `Tenant.suspend` is called on an already-suspended tenant.
 */
export class TenantAlreadySuspendedError extends DomainError {
  constructor() {
    super('TENANT_ALREADY_SUSPENDED', 'tenant is already suspended')
  }
}
