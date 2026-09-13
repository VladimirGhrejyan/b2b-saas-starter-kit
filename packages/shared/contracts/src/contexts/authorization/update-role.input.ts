import {z} from 'zod'

import {permissionSchema} from './permission'

export const updateRoleInputSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    permissions: z.array(permissionSchema).min(1).optional(),
  })
  .refine((value) => value.name !== undefined || value.permissions !== undefined, {
    message: 'Provide name and/or permissions',
  })
  .meta({
    id: 'UpdateRoleInput',
    description: 'Body for renaming and/or replacing custom role permissions',
  })

export type UpdateRoleInput = z.infer<typeof updateRoleInputSchema>
