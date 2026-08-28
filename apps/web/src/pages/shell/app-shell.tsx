import {Outlet} from 'react-router'

import {SessionSelectors, useAppSelector} from '@b2b-saas-starter-kit/frontend-core'

import {DevPrincipalPicker} from '@/features/dev-principal'
import {getMeQuery, useGetMeQuery} from '@/features/me'
import {isErrorOutput} from '@/shared/api/is-error-output'

import {AppNav} from './ui/app-nav'

export function AppShell() {
  const userId = useAppSelector(SessionSelectors.userId)
  const tenantId = useAppSelector(SessionSelectors.activeTenantId)
  const meQuery = getMeQuery(userId, tenantId)
  const {error} = useGetMeQuery(meQuery.arg, {skip: meQuery.skip})

  return (
    <div>
      <AppNav tenantId={tenantId} />
      <DevPrincipalPicker />
      {isErrorOutput(error) ? (
        <p>
          {error.code}: {error.message}
        </p>
      ) : null}
      <Outlet />
    </div>
  )
}
