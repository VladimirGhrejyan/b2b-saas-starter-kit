import type {IncomingHttpHeaders} from 'node:http'

export type IdempotencyIncomingRequest = {
  method?: string
  url?: string
  headers: IncomingHttpHeaders
  body?: unknown
  route?: {path?: string}
}

export type IdempotencyOutgoingResponse = {
  statusCode: number
  status: (code: number) => unknown
}
