import {z} from 'zod'

import {RoleId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export const attachMemberInputSchema = z
  .object({
    userId: UserId.schema,
    roleIds: z.array(RoleId.schema).min(1),
  })
  .meta({
    id: 'AttachMemberInput',
    description: 'Body for attaching an existing user as a member',
  })

export type AttachMemberInput = z.infer<typeof attachMemberInputSchema>
