import type {TelemetryConfig} from './telemetry-config'
import {telemetryConfigSchema} from './telemetry-config'
import type {TelemetryEnv} from './telemetry-env.types'

export function mapTelemetryConfig(env: TelemetryEnv): TelemetryConfig {
  return telemetryConfigSchema.parse({
    enabled: env.enabled,
    serviceName: env.serviceName ?? env.appType,
    otlpEndpoint: env.otlpEndpoint,
  })
}
