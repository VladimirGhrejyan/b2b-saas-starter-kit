import {DomainError} from '../../shared-kernel/domain-error'

/**
 * Thrown when `Tenant.activate` is called on an already-active tenant.
 */
export class TenantAlreadyActiveError extends DomainError {
  constructor() {
    super('TENANT_ALREADY_ACTIVE', 'tenant is already active')
  }
}
