import type {TelemetryConfig} from './telemetry-config'
import {telemetryConfigSchema} from './telemetry-config'
import type {TelemetryEnv} from './telemetry-env.types'

export function mapTelemetryConfig(env: TelemetryEnv): TelemetryConfig {
  return telemetryConfigSchema.parse({
    enabled: env.TELEMETRY_ENABLED === 'true',
    serviceName: env.OTEL_SERVICE_NAME ?? env.APP_TYPE,
    otlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
  })
}
