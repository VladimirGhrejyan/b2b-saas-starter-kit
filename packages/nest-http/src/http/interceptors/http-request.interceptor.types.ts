import type {IncomingHttpHeaders} from 'node:http'

import type {RequestContext} from '@b2b-saas-starter-kit/platform'

export type HttpIncomingRequest = {
  method?: string
  url?: string
  originalUrl?: string
  headers: IncomingHttpHeaders
  route?: {path?: string}
} & Record<symbol, RequestContext | undefined>

export type HttpOutgoingResponse = {
  statusCode: number
  setHeader: (name: string, value: string) => void
  once: (event: 'finish', listener: () => void) => void
}
