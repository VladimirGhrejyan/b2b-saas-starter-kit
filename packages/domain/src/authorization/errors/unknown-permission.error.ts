import {DomainError} from '../../shared-kernel/domain-error'

/**
 * Thrown when a permission is not in {@link PermissionCatalog}.
 */
export class UnknownPermissionError extends DomainError {
  constructor(permission: string) {
    super('PERMISSION_UNKNOWN', `permission '${permission}' is not in the catalog`)
  }
}
