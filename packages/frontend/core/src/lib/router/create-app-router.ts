import {createBrowserRouter, createHashRouter} from 'react-router'

import type {AppRouter, CreateAppRouterOptions} from './create-app-router.types'

export function createAppRouter(options: CreateAppRouterOptions): AppRouter {
  const basename = options.basename === '/' ? undefined : options.basename?.replace(/\/+$/, '')

  if (options.history === 'hash') {
    return createHashRouter(options.routes, basename === undefined ? undefined : {basename})
  }

  return createBrowserRouter(options.routes, basename === undefined ? undefined : {basename})
}
