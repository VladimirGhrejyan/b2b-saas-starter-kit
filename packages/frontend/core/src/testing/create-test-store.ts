import {createWebPorts} from '../adapters/web/create-web-ports'
import {configureFrontendCore} from '../config/configure-frontend-core'
import {createStore} from '../lib/redux/create-store'
import type {CreateStoreOptions} from '../lib/redux/create-store.types'

export function createTestStore(options: CreateStoreOptions = {}) {
  configureFrontendCore({
    baseUrl: 'http://frontend-core.test',
    ports: createWebPorts(),
  })

  return createStore(options)
}
