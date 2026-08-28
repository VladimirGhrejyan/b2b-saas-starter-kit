import {FrontendCoreConfigLocator} from './frontend-core-config.locator'
import type {FrontendCoreConfig} from './frontend-core-config.types'

export function configureFrontendCore(config: FrontendCoreConfig): void {
  FrontendCoreConfigLocator.configure(config)
}
