import {z} from 'zod'

export const corsSchema = z.object({
  origins: z.array(z.string().min(1)).default([]),
  credentials: z.boolean().default(false),
})

export const swaggerBasicAuthSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export const swaggerSchema = z
  .object({
    enabled: z.boolean().optional(),
    path: z.string().min(1).default('/docs'),
    basicAuth: swaggerBasicAuthSchema.optional(),
  })
  .default({path: '/docs'})

export const httpSchema = z.object({
  title: z.string().min(1).default('B2B SaaS API'),
  port: z.coerce.number().int().positive().default(3000),
  host: z.string().min(1).optional(),
  version: z.string().min(1).default('1'),
  globalPrefix: z.string().min(1).optional(),
  plainHttp: z.boolean().default(false),
  cors: corsSchema,
  swagger: swaggerSchema,
})
