import type {AppRouter, AppRouterHistory} from '@b2b-saas-starter-kit/frontend-core'
import {createAppRouter} from '@b2b-saas-starter-kit/frontend-core'

import {adminRoutes} from '@/pages/shell/admin-routes'

export function createAdminRouter(history: AppRouterHistory): AppRouter {
  return createAppRouter({
    history,
    routes: adminRoutes,
  })
}
