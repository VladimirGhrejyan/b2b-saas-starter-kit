import type {IncomingHttpHeaders} from 'node:http'

/** Reads a single HTTP header value, ignoring duplicates. */
export function readHeader(headers: IncomingHttpHeaders, name: string): string | undefined {
  const value = headers[name]

  if (typeof value === 'string' && value.length > 0) {
    return value
  }

  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].length > 0) {
    return value[0]
  }

  return undefined
}
