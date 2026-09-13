import {z} from 'zod'

import {MembershipId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export const acceptInvitationOutputSchema = z
  .object({
    userId: UserId.schema,
    membershipId: MembershipId.schema,
    tenantId: TenantId.schema,
  })
  .meta({
    id: 'AcceptInvitationOutput',
    description: 'Accepted invitation membership',
  })

export type AcceptInvitationOutput = z.infer<typeof acceptInvitationOutputSchema>
