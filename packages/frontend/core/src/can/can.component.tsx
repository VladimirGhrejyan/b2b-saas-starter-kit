import type {ReactNode} from 'react'

import type {ApiPermission} from '@b2b-saas-starter-kit/contracts'

import {useCan} from './use-can'

type CanProps = {
  permission: ApiPermission
  children: ReactNode
}

export function Can({permission, children}: CanProps) {
  const allowed = useCan(permission)

  if (!allowed) {
    return null
  }

  return children
}
