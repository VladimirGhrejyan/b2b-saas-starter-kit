import type {AppRouter, AppRouterHistory} from '@b2b-saas-starter-kit/frontend-core'
import {createAppRouter} from '@b2b-saas-starter-kit/frontend-core'

import {webRoutes} from '@/pages/shell/web-routes'

export function createWebRouter(history: AppRouterHistory): AppRouter {
  return createAppRouter({
    history,
    routes: webRoutes,
  })
}
