import {z} from 'zod'

import {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export const authSessionOutputSchema = z
  .object({
    accessToken: z.string().min(1),
    expiresIn: z.number().int().positive(),
    userId: UserId.schema,
    tenantId: TenantId.schema.optional(),
  })
  .meta({
    id: 'AuthSessionOutput',
    description: 'Short-lived access token and principal ids',
  })

export type AuthSessionOutput = z.infer<typeof authSessionOutputSchema>
