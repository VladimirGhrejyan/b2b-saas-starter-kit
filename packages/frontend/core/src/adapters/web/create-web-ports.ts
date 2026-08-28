import type {FrontendCorePorts} from '../../ports/frontend-core-ports'

import {ConsoleLogger} from './console-logger'
import {InMemoryStorage} from './in-memory-storage'
import {WebLinkingAdapter} from './web-linking'
import {WebWindowAdapter} from './web-window'

export function createWebPorts(): FrontendCorePorts {
  return {
    storage: new InMemoryStorage(),
    logger: new ConsoleLogger(),
    linking: new WebLinkingAdapter(),
    window: new WebWindowAdapter(),
  }
}
