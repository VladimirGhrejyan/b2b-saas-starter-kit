import {createBrowserRouter, createHashRouter} from 'react-router'

import type {AppRouter, CreateAppRouterOptions} from './create-app-router.types'

export function createAppRouter(options: CreateAppRouterOptions): AppRouter {
  if (options.history === 'hash') {
    return createHashRouter(options.routes)
  }

  return createBrowserRouter(options.routes)
}
