import type {ApiKeyId, Permission} from '@b2b-saas-starter-kit/shared-kernel-types'

export const API_KEY_PERMISSIONS = Symbol('API_KEY_PERMISSIONS')

/**
 * Sanctioned identity read for authorization: permissions minted on an API key.
 */
export interface ApiKeyPermissionsPort {
  permissionsFor(apiKeyId: ApiKeyId): Promise<readonly Permission[]>
}
