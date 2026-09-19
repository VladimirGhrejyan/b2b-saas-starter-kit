import type {TelemetryConfig} from './config/telemetry-config'
import type {TelemetryHandle} from './config/telemetry-handle.types'

/**
 * Starts the OpenTelemetry SDK when `config.enabled` is true. Otherwise returns a no-op handle.
 */
export async function startTelemetry(config: TelemetryConfig): Promise<TelemetryHandle> {
  if (!config.enabled) {
    return {shutdown: () => Promise.resolve()}
  }

  const {startNodeSdk} = await import('./sdk/start-node-sdk')

  return startNodeSdk(config)
}
