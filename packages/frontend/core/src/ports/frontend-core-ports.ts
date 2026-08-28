import type {LinkingPort} from './linking.port'
import type {LoggerPort} from './logger.port'
import type {StoragePort} from './storage.port'
import type {WindowPort} from './window.port'

export interface FrontendCorePorts {
  storage: StoragePort
  logger: LoggerPort
  linking: LinkingPort
  window: WindowPort
}
