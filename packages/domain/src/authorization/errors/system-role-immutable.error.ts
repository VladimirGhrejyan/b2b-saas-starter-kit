import {DomainError} from '../../shared-kernel/domain-error'

/**
 * Thrown when a system role is renamed, re-permissioned, or deleted.
 */
export class SystemRoleImmutableError extends DomainError {
  constructor() {
    super('SYSTEM_ROLE_IMMUTABLE', 'system roles cannot be renamed, re-permissioned, or deleted')
  }
}
