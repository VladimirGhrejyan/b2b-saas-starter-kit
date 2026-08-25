import {afterEach, beforeEach} from 'vitest'

import {initLogger, resetLogger} from '@b2b-saas-starter-kit/platform'

import {MemoryLogger} from './src/testing/memory-logger'

beforeEach(() => {
  initLogger(new MemoryLogger())
})

afterEach(() => {
  resetLogger()
})
