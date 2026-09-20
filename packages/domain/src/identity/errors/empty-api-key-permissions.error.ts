import {DomainError} from '../../shared-kernel/domain-error'

/**
 * Thrown when an API key is created or updated with no permissions.
 */
export class EmptyApiKeyPermissionsError extends DomainError {
  constructor() {
    super('API_KEY_EMPTY_PERMISSIONS', 'API key permissions must not be empty')
  }
}
