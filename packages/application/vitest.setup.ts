import {afterEach, beforeEach} from 'vitest'

import {LoggerLocator} from '@b2b-saas-starter-kit/platform'

import {MemoryLogger} from './src/testing/memory-logger'

beforeEach(() => {
  LoggerLocator.init(new MemoryLogger())
})

afterEach(() => {
  LoggerLocator.reset()
})
