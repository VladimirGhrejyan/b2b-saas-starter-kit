import type {ApiPermission} from '@b2b-saas-starter-kit/contracts'

import {useAppSelector} from '../lib/react/use-app-selector'
import {SessionSelectors} from '../session/session.selectors'

import {can} from './can'

export function useCan(permission: ApiPermission): boolean {
  const permissions = useAppSelector(SessionSelectors.effectivePermissions)

  return can(permissions, permission)
}
