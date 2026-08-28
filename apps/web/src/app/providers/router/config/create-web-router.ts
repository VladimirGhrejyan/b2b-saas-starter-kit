import type {AppRouter, AppRouterHistory} from '@b2b-saas-starter-kit/frontend-core'
import {createAppRouter} from '@b2b-saas-starter-kit/frontend-core'

import {HomePage} from '@/pages/home/home-page'

import {paths} from '../model/paths'

export function createWebRouter(history: AppRouterHistory): AppRouter {
  return createAppRouter({
    history,
    routes: [{path: paths.home, Component: HomePage}],
  })
}
