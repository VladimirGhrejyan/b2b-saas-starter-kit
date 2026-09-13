import {WebAccessTokenRefresh} from '../lib/api/web-access-token-refresh'

export function resetWebAccessTokenRefresh(): void {
  WebAccessTokenRefresh.instance.reset()
}
