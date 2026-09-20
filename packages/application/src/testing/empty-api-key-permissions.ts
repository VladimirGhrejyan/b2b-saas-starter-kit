import type {ApiKeyPermissionsPort} from '../shared/api-key-permissions.port'

/**
 * No-op {@link ApiKeyPermissionsPort} for tests that do not exercise API keys.
 */
export const emptyApiKeyPermissions: ApiKeyPermissionsPort = {
  permissionsFor() {
    return Promise.resolve([])
  },
}
