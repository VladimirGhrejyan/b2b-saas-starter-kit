import {DomainError} from '../shared-kernel/domain-error'

/**
 * Thrown when a tenant name is blank.
 */
export class InvalidTenantNameError extends DomainError {
  constructor() {
    super('TENANT_INVALID_NAME', 'name must not be blank')
  }
}
