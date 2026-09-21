import {z} from 'zod'

export const telemetrySchema = z
  .object({
    enabled: z.boolean().default(false),
    otlpEndpoint: z.string().min(1).optional(),
    serviceName: z.string().min(1).optional(),
  })
  .default({enabled: false})
