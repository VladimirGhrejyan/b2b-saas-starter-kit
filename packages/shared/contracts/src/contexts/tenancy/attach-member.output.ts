import {z} from 'zod'

import {MembershipId} from '@b2b-saas-starter-kit/shared-kernel-types'

export const attachMemberOutputSchema = z
  .object({
    id: MembershipId.schema,
  })
  .meta({
    id: 'AttachMemberOutput',
    description: 'Created membership id',
  })

export type AttachMemberOutput = z.infer<typeof attachMemberOutputSchema>
