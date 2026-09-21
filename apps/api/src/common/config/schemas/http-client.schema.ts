import {z} from 'zod'

export const httpClientSchema = z
  .object({
    timeoutMs: z.number().int().positive().optional(),
    connectTimeoutMs: z.number().int().positive().optional(),
    poolMax: z.number().int().positive().optional(),
    maxResponseBytes: z.number().int().positive().optional(),
    userAgent: z.string().min(1).optional(),
    maxRedirects: z.number().int().nonnegative().optional(),
    httpsProxy: z.string().optional(),
    noProxy: z.string().optional(),
  })
  .default({})
