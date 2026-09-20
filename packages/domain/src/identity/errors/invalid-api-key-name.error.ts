import {DomainError} from '../../shared-kernel/domain-error'

/**
 * Thrown when an API key name is blank.
 */
export class InvalidApiKeyNameError extends DomainError {
  constructor() {
    super('API_KEY_INVALID_NAME', 'name must not be blank')
  }
}
