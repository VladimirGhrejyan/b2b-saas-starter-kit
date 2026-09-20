import {z} from 'zod'

import {permissionSchema} from '../authorization/permission'

export const updateApiKeyInputSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    permissions: z.array(permissionSchema).min(1).optional(),
  })
  .refine((value) => value.name !== undefined || value.permissions !== undefined, {
    message: 'name or permissions is required',
  })
  .meta({
    id: 'UpdateApiKeyInput',
    description: 'Body for updating an API key name and/or permissions',
  })

export type UpdateApiKeyInput = z.infer<typeof updateApiKeyInputSchema>
