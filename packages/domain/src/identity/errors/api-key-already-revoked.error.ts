import {DomainError} from '../../shared-kernel/domain-error'

/**
 * Thrown when a revoked API key is revoked again.
 */
export class ApiKeyAlreadyRevokedError extends DomainError {
  constructor() {
    super('API_KEY_ALREADY_REVOKED', 'API key is already revoked')
  }
}
