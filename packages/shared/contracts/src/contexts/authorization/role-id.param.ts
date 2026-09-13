import {z} from 'zod'

import {RoleId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

export const roleIdParamSchema = z
  .object({
    tenantId: TenantId.schema,
    roleId: RoleId.schema,
  })
  .meta({
    id: 'RoleIdParam',
    description: 'Path parameters identifying a tenant role',
  })

export type RoleIdParam = z.infer<typeof roleIdParamSchema>
