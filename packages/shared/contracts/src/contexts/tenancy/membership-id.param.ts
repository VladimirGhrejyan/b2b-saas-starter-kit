import {z} from 'zod'

import {MembershipId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

export const membershipIdParamSchema = z
  .object({
    tenantId: TenantId.schema,
    membershipId: MembershipId.schema,
  })
  .meta({
    id: 'MembershipIdParam',
    description: 'Path parameters identifying a membership',
  })

export type MembershipIdParam = z.infer<typeof membershipIdParamSchema>
