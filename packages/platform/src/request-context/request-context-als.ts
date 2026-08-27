import {AsyncLocalStorage} from 'node:async_hooks'

import type {RequestContext} from './request-context.types'

export const requestContextAls = new AsyncLocalStorage<RequestContext>()
