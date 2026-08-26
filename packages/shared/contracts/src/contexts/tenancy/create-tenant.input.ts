import {z} from 'zod'

export const createTenantInputSchema = z
  .object({
    name: z.string().trim().min(1),
  })
  .meta({
    id: 'CreateTenantInput',
    description: 'Body for creating a tenant',
  })

export type CreateTenantInput = z.infer<typeof createTenantInputSchema>
