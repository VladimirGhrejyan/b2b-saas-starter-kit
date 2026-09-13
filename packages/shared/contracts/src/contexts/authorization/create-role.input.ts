import {z} from 'zod'

import {permissionSchema} from './permission'

export const createRoleInputSchema = z
  .object({
    name: z.string().trim().min(1),
    permissions: z.array(permissionSchema).min(1),
  })
  .meta({
    id: 'CreateRoleInput',
    description: 'Body for creating a custom role',
  })

export type CreateRoleInput = z.infer<typeof createRoleInputSchema>
