import type {FrontendCoreConfig} from './frontend-core-config.types'
import {FrontendCoreNotConfiguredError} from './frontend-core-not-configured.error'

/**
 * Process-wide frontend-core config slot.
 *
 * `configure` overwrites. `get` throws {@link FrontendCoreNotConfiguredError} when unset.
 * `reset` is for tests (`afterEach`) and teardown.
 */
export class FrontendCoreConfigLocator {
  static #config: FrontendCoreConfig | undefined

  static configure(config: FrontendCoreConfig): void {
    FrontendCoreConfigLocator.#config = config
  }

  static get(): FrontendCoreConfig {
    if (FrontendCoreConfigLocator.#config === undefined) {
      throw new FrontendCoreNotConfiguredError()
    }

    return FrontendCoreConfigLocator.#config
  }

  static reset(): void {
    FrontendCoreConfigLocator.#config = undefined
  }
}
