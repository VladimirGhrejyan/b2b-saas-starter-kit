import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

import {clearSession, setSession} from '../../session/session.slice'
import {sessionFromAuthOutput} from '../../session/session-from-auth-output'
import type {AppDispatch} from '../redux/create-store.types'

import {WebAccessTokenRefresh} from './web-access-token-refresh'

export async function restoreWebSession(dispatch: AppDispatch): Promise<boolean> {
  const output = await WebAccessTokenRefresh.instance.run()

  if (TypeScriptUtils.isNil(output)) {
    dispatch(clearSession())

    return false
  }

  dispatch(setSession(sessionFromAuthOutput(output)))

  return true
}
