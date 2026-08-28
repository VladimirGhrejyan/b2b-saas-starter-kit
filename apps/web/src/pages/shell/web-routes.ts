import type {RouteObject} from 'react-router'

import {HomePage} from '@/pages/home/home-page'
import {MePage} from '@/pages/me/me-page'
import {MembersPage} from '@/pages/members/members-page'
import {AppShell} from '@/pages/shell/app-shell'
import {paths} from '@/shared/router'

export const webRoutes: RouteObject[] = [
  {
    path: paths.home,
    Component: AppShell,
    children: [
      {index: true, Component: HomePage},
      {path: 'me', Component: MePage},
      {path: 'tenants/:tenantId/members', Component: MembersPage},
    ],
  },
]
