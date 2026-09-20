import {DomainError} from '../../shared-kernel/domain-error'

/**
 * Thrown when a key is minted with `identity.api_keys.manage`.
 */
export class ApiKeyCannotManageKeysError extends DomainError {
  constructor() {
    super('API_KEY_CANNOT_MANAGE_KEYS', 'API keys cannot hold identity.api_keys.manage')
  }
}
