import {FrontendCoreConfigLocator} from '../config/frontend-core-config.locator'

export function resetFrontendCoreConfig(): void {
  FrontendCoreConfigLocator.reset()
}
