import {useEffect, useState} from 'react'

import {Navigate, Outlet} from 'react-router'

import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'
import {restoreWebSession, SessionSelectors, useAppDispatch, useAppSelector} from '@b2b-saas-starter-kit/frontend-core'

import {paths} from '@/shared/router'

export function RequireSession() {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector(SessionSelectors.accessToken)
  const [allowed, setAllowed] = useState(!TypeScriptUtils.isNil(accessToken))
  const [checked, setChecked] = useState(!TypeScriptUtils.isNil(accessToken))

  useEffect(() => {
    if (!TypeScriptUtils.isNil(accessToken)) {
      setAllowed(true)
      setChecked(true)

      return
    }

    let cancelled = false

    setChecked(false)

    void restoreWebSession(dispatch).then((restored) => {
      if (cancelled) {
        return
      }

      setAllowed(restored)
      setChecked(true)
    })

    return () => {
      cancelled = true
    }
  }, [accessToken, dispatch])

  if (!checked) {
    return null
  }

  if (!allowed) {
    return <Navigate to={paths.login} replace />
  }

  return <Outlet />
}
