import {DomainError} from '../../shared-kernel/domain-error'

/**
 * Thrown when a role name is blank.
 */
export class InvalidRoleNameError extends DomainError {
  constructor() {
    super('ROLE_INVALID_NAME', 'name must not be blank')
  }
}
