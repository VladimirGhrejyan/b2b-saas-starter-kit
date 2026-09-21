import {z} from 'zod'

export const logSchema = z
  .object({
    level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    pretty: z.boolean().optional(),
  })
  .default({level: 'info'})
