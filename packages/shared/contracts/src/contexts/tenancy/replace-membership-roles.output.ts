import {z} from 'zod'

import {MembershipId, RoleId} from '@b2b-saas-starter-kit/shared-kernel-types'

export const replaceMembershipRolesOutputSchema = z
  .object({
    membershipId: MembershipId.schema,
    roleIds: z.array(RoleId.schema),
  })
  .meta({
    id: 'ReplaceMembershipRolesOutput',
    description: 'Updated membership role ids',
  })

export type ReplaceMembershipRolesOutput = z.infer<typeof replaceMembershipRolesOutputSchema>
