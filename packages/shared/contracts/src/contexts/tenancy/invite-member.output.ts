import {z} from 'zod'

import {InvitationId} from '@b2b-saas-starter-kit/shared-kernel-types'

export const inviteMemberOutputSchema = z
  .object({
    id: InvitationId.schema,
  })
  .meta({
    id: 'InviteMemberOutput',
    description: 'Created invitation id',
  })

export type InviteMemberOutput = z.infer<typeof inviteMemberOutputSchema>
