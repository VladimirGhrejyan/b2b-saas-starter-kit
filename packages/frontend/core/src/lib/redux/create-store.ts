import {configureStore} from '@reduxjs/toolkit'

import {FrontendCoreConfigLocator} from '../../config/frontend-core-config.locator'
import {sessionReducer} from '../../session/session.slice'
import {api} from '../api/api'

import type {AppStore, AppThunkExtra, CreateStoreOptions} from './create-store.types'

export function createStore(options: CreateStoreOptions = {}): AppStore {
  const config = FrontendCoreConfigLocator.get()
  const extraMiddleware = options.extraMiddleware ?? []
  const configureAppStore = configureStore as unknown as (storeOptions: unknown) => AppStore

  return configureAppStore({
    reducer: {
      session: sessionReducer,
      [api.reducerPath]: api.reducer,
      ...options.extraSlices,
    },
    preloadedState: options.preloadedState,
    middleware: (
      getDefaultMiddleware: (middlewareOptions?: {thunk?: {extraArgument?: AppThunkExtra}}) => {
        concat: (...items: unknown[]) => unknown
      },
    ) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: {ports: config.ports},
        },
      }).concat(api.middleware, ...extraMiddleware),
  })
}
