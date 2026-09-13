import type {RouteObject} from 'react-router'

import {RequireSession} from '@/features/auth'
import {HomePage} from '@/pages/home/home-page'
import {LoginPage} from '@/pages/login/login-page'
import {MePage} from '@/pages/me/me-page'
import {MembersPage} from '@/pages/members/members-page'
import {AppShell} from '@/pages/shell/app-shell'
import {paths} from '@/shared/router'

export const webRoutes: RouteObject[] = [
  {
    path: paths.login,
    Component: LoginPage,
  },
  {
    path: paths.home,
    Component: RequireSession,
    children: [
      {
        Component: AppShell,
        children: [
          {index: true, Component: HomePage},
          {path: 'me', Component: MePage},
          {path: 'tenants/:tenantId/members', Component: MembersPage},
        ],
      },
    ],
  },
]
