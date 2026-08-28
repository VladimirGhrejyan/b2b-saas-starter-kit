import {createSlice, type PayloadAction} from '@reduxjs/toolkit'

import type {SessionState} from './session.state'
import {sessionInitialState} from './session.state'

export const sessionSlice = createSlice({
  name: 'session',
  initialState: sessionInitialState,
  reducers: {
    setSession(_state, action: PayloadAction<SessionState>) {
      return action.payload
    },
    clearSession() {
      return sessionInitialState
    },
  },
})

export const {setSession, clearSession} = sessionSlice.actions
export const sessionReducer = sessionSlice.reducer
