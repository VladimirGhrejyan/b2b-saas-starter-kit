import {z} from 'zod'

import {permissionSchema} from '../authorization/permission'

export const createApiKeyInputSchema = z
  .object({
    name: z.string().trim().min(1),
    permissions: z.array(permissionSchema).min(1),
    expiresAt: z.iso.datetime().optional(),
  })
  .meta({
    id: 'CreateApiKeyInput',
    description: 'Body for minting a tenant API key',
  })

export type CreateApiKeyInput = z.infer<typeof createApiKeyInputSchema>
