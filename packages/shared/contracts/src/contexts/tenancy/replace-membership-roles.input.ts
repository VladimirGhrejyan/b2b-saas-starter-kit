import {z} from 'zod'

import {RoleId} from '@b2b-saas-starter-kit/shared-kernel-types'

export const replaceMembershipRolesInputSchema = z
  .object({
    roleIds: z.array(RoleId.schema).min(1),
  })
  .meta({
    id: 'ReplaceMembershipRolesInput',
    description: 'Body for replacing membership role ids',
  })

export type ReplaceMembershipRolesInput = z.infer<typeof replaceMembershipRolesInputSchema>
