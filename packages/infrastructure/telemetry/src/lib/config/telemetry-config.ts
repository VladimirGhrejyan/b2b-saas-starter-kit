import {z} from 'zod'

export const TELEMETRY_ENDPOINT_REQUIRED = 'OTEL_EXPORTER_OTLP_ENDPOINT is required when TELEMETRY_ENABLED is true'

export const telemetryConfigSchema = z
  .object({
    enabled: z.boolean(),
    serviceName: z.string().min(1),
    otlpEndpoint: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.enabled && value.otlpEndpoint === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['otlpEndpoint'],
        message: TELEMETRY_ENDPOINT_REQUIRED,
      })
    }
  })

export type TelemetryConfig = z.infer<typeof telemetryConfigSchema>
