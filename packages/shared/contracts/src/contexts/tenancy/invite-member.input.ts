import {z} from 'zod'

import {RoleId} from '@b2b-saas-starter-kit/shared-kernel-types'

export const inviteMemberInputSchema = z
  .object({
    email: z.email(),
    roleIds: z.array(RoleId.schema).min(1),
  })
  .meta({
    id: 'InviteMemberInput',
    description: 'Body for inviting a member by email',
  })

export type InviteMemberInput = z.infer<typeof inviteMemberInputSchema>
