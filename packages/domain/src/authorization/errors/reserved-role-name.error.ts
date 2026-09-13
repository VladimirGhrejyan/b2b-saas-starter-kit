import {DomainError} from '../../shared-kernel/domain-error'

/**
 * Thrown when a custom role uses a reserved system role name.
 */
export class ReservedRoleNameError extends DomainError {
  constructor() {
    super('RESERVED_ROLE_NAME', 'custom role names cannot be Owner, Admin, or Member')
  }
}
