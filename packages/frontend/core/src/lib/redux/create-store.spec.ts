import {createSlice} from '@reduxjs/toolkit'

import {FrontendCoreNotConfiguredError} from '../../config/frontend-core-not-configured.error'
import {createTestStore} from '../../testing/create-test-store'
import {resetFrontendCoreConfig} from '../../testing/reset-frontend-core-config'

import {createStore} from './create-store'

const extraSlice = createSlice({
  name: 'counter',
  initialState: {value: 0},
  reducers: {},
})

describe('createStore', () => {
  it('throws when configureFrontendCore was skipped', () => {
    resetFrontendCoreConfig()

    expect(() => createStore()).toThrow(FrontendCoreNotConfiguredError)
  })

  it('registers extra slices', () => {
    const store = createTestStore({
      extraSlices: {counter: extraSlice.reducer},
    })

    expect((store.getState() as unknown as {counter: {value: number}}).counter.value).toBe(0)
  })
})
