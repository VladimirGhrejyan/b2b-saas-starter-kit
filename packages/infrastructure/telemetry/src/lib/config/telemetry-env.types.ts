export type TelemetryEnv = {
  readonly TELEMETRY_ENABLED: 'true' | 'false'
  readonly OTEL_EXPORTER_OTLP_ENDPOINT?: string
  readonly OTEL_SERVICE_NAME?: string
  readonly APP_TYPE: string
}
