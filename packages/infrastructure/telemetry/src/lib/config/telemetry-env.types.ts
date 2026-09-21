export type TelemetryEnv = {
  readonly enabled: boolean
  readonly otlpEndpoint?: string
  readonly serviceName?: string
  readonly appType: string
}
