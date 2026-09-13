import {z} from 'zod'

import {roleOutputSchema} from './role.output'

export const tenantRolesOutputSchema = z
  .object({
    roles: z.array(roleOutputSchema),
  })
  .meta({
    id: 'TenantRolesOutput',
    description: 'Roles in a tenant',
  })

export type TenantRolesOutput = z.infer<typeof tenantRolesOutputSchema>
