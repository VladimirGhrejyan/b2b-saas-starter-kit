import {z} from 'zod'

export const healthCheckResultSchema = z.object({
  status: z.enum(['up', 'down']),
  message: z.string().min(1).optional(),
})

export const healthOutputSchema = z
  .object({
    status: z.enum(['ok', 'error']),
    checks: z.record(z.string(), healthCheckResultSchema).optional(),
  })
  .meta({
    id: 'HealthOutput',
    description: 'Liveness and readiness probe envelope',
  })

export type HealthCheckResult = z.infer<typeof healthCheckResultSchema>
export type HealthOutput = z.infer<typeof healthOutputSchema>
