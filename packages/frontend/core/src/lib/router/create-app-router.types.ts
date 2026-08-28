import type {DataRouter, RouteObject} from 'react-router'

export type AppRouter = DataRouter

export type AppRouterHistory = 'browser' | 'hash'

export type CreateAppRouterOptions = {
  history: AppRouterHistory
  routes: RouteObject[]
}
