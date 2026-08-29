import {z} from 'zod'

export const httpClientConfigSchema = z.object({
  HTTP_CLIENT_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  HTTP_CLIENT_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
  HTTP_CLIENT_POOL_MAX: z.coerce.number().int().positive().default(16),
  HTTP_CLIENT_MAX_RESPONSE_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(2 * 1024 * 1024),
  HTTP_CLIENT_USER_AGENT: z.string().min(1).default('b2b-saas-http-client'),
  HTTP_CLIENT_MAX_REDIRECTS: z.coerce.number().int().nonnegative().default(3),
  HTTPS_PROXY: z.string().optional(),
  NO_PROXY: z.string().optional(),
})

export type HttpClientConfig = z.infer<typeof httpClientConfigSchema>
