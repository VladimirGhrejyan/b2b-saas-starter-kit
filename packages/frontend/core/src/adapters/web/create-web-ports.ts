import type {FrontendCorePorts} from '../../ports/frontend-core-ports'

import {ConsoleLogger} from './console-logger'
import type {CreateWebPortsOptions} from './create-web-ports.types'
import {InMemoryStorage} from './in-memory-storage'
import {WebLinkingAdapter} from './web-linking'
import {WebWindowAdapter} from './web-window'

export function createWebPorts(options: CreateWebPortsOptions = {}): FrontendCorePorts {
  const nodeEnv = options.nodeEnv ?? 'development'

  return {
    storage: new InMemoryStorage(),
    logger: new ConsoleLogger(nodeEnv === 'development'),
    linking: new WebLinkingAdapter(),
    window: new WebWindowAdapter(),
  }
}
