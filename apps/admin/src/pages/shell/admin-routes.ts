import type {RouteObject} from 'react-router'

import {HomePage} from '@/pages/home/home-page'
import {AppShell} from '@/pages/shell/app-shell'
import {paths} from '@/shared/router'

export const adminRoutes: RouteObject[] = [
  {
    path: paths.home,
    Component: AppShell,
    children: [{index: true, Component: HomePage}],
  },
]
