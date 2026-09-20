import {z} from 'zod'

import {ApiKeyId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {permissionSchema} from '../authorization/permission'

export const apiKeyOutputSchema = z
  .object({
    id: ApiKeyId.schema,
    name: z.string(),
    prefix: z.string(),
    permissions: z.array(permissionSchema),
    expiresAt: z.iso.datetime().optional(),
    revokedAt: z.iso.datetime().optional(),
    lastUsedAt: z.iso.datetime().optional(),
  })
  .meta({
    id: 'ApiKeyOutput',
    description: 'A tenant API key without the secret hash or raw token',
  })

export type ApiKeyOutput = z.infer<typeof apiKeyOutputSchema>
