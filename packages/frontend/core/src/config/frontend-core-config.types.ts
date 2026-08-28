import type {FrontendCorePorts} from '../ports/frontend-core-ports'

export type FrontendCoreConfig = {
  baseUrl: string
  ports: FrontendCorePorts
}
