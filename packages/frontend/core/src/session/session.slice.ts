import {createSlice, type PayloadAction} from '@reduxjs/toolkit'

import {ObjectUtils} from '@b2b-saas-starter-kit/utils'

import type {SessionState} from './session.state'
import {sessionInitialState} from './session.state'

export const sessionSlice = createSlice({
  name: 'session',
  initialState: sessionInitialState,
  reducers: {
    setSession(_state, action: PayloadAction<SessionState>) {
      return action.payload
    },
    patchSession(state, action: PayloadAction<Partial<SessionState>>) {
      return ObjectUtils.merge(state, action.payload)
    },
    clearSession() {
      return sessionInitialState
    },
  },
})

export const {setSession, patchSession, clearSession} = sessionSlice.actions
export const sessionReducer = sessionSlice.reducer
