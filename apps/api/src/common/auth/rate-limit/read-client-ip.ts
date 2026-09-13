import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

import type {ClientIpRequest} from './read-client-ip.types'

/**
 * Reads the connection IP. Does not trust X-Forwarded-For (no trust proxy yet).
 */
export function readClientIp(request: ClientIpRequest): string {
  if (TypeScriptUtils.isNonEmptyString(request.ip)) {
    return request.ip
  }

  if (TypeScriptUtils.isNonEmptyString(request.socket?.remoteAddress)) {
    return request.socket.remoteAddress
  }

  return 'unknown'
}
