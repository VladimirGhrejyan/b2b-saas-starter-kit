import type {HttpMethodName} from '@b2b-saas-starter-kit/contracts'

export type RouteMetadata = {
  method: HttpMethodName
  path: string
  summary?: string
  operationId?: string
  tags?: readonly string[]
}
