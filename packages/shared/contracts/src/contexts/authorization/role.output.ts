import {z} from 'zod'

import {RoleId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {permissionSchema} from './permission'

export const roleOutputSchema = z
  .object({
    id: RoleId.schema,
    name: z.string(),
    permissions: z.array(permissionSchema),
    isSystem: z.boolean(),
  })
  .meta({
    id: 'RoleOutput',
    description: 'A tenant role and its catalog permissions',
  })

export type RoleOutput = z.infer<typeof roleOutputSchema>
