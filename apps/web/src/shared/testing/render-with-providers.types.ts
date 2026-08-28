import type {RouteObject} from 'react-router'

import type {CreateStoreOptions} from '@b2b-saas-starter-kit/frontend-core'

export type RenderWithProvidersOptions = {
  route?: string
  routes?: RouteObject[]
  preloadedState?: CreateStoreOptions['preloadedState']
  initialEntries?: string[]
}
