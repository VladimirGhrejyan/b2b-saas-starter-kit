import {z} from 'zod'

export const outboxSchema = z.object({
  pollIntervalMs: z.number().int().positive().default(1000),
  batchSize: z.number().int().positive().default(25),
  staleProcessingMs: z.number().int().positive().default(300_000),
})
