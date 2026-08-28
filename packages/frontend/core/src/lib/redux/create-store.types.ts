import type {EnhancedStore, Middleware, Reducer, ThunkDispatch, UnknownAction} from '@reduxjs/toolkit'

import type {FrontendCorePorts} from '../../ports/frontend-core-ports'
import type {SessionState} from '../../session/session.state'

export type CreateStoreOptions = {
  preloadedState?: {
    session?: SessionState
  }
  extraSlices?: Record<string, Reducer>
  extraMiddleware?: Middleware[]
}

export type AppThunkExtra = {
  ports: FrontendCorePorts
}

export type RootState = {
  session: SessionState
  api: unknown
}

export type AppDispatch = ThunkDispatch<RootState, AppThunkExtra, UnknownAction>

export type AppStore = Omit<EnhancedStore<RootState>, 'dispatch'> & {
  dispatch: AppDispatch
}
