import type {AuthSessionOutput} from '@b2b-saas-starter-kit/contracts'
import {type AppDispatch, sessionFromAuthOutput, setSession} from '@b2b-saas-starter-kit/frontend-core'

export function applyAuthSession(dispatch: AppDispatch, output: AuthSessionOutput): void {
  dispatch(setSession(sessionFromAuthOutput(output)))
}
