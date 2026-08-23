import {DomainError} from '../shared-kernel/domain-error'

/**
 * Thrown when `Role.create` is given no permissions.
 */
export class EmptyRolePermissionsError extends DomainError {
  constructor() {
    super('ROLE_EMPTY_PERMISSIONS', 'a role must have at least one permission')
  }
}
