import type {IncomingHttpHeaders} from 'node:http'

import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

/** Reads a single HTTP header value, ignoring duplicates. */
export function readHeader(headers: IncomingHttpHeaders, name: string): string | undefined {
  const value = headers[name]

  if (TypeScriptUtils.isNonEmptyString(value)) {
    return value
  }

  if (Array.isArray(value) && TypeScriptUtils.isNonEmptyString(value[0])) {
    return value[0]
  }

  return undefined
}
