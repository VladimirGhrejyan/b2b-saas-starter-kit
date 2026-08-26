import {z} from 'zod'

import {MembershipId, MembershipStatus, RoleId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

const tenantMemberSchema = z
  .object({
    membershipId: MembershipId.schema,
    userId: UserId.schema,
    roleIds: z.array(RoleId.schema),
    status: MembershipStatus.schema,
  })
  .meta({
    id: 'TenantMember',
    description: 'A membership in the tenant',
  })

export const tenantMembersOutputSchema = z
  .object({
    members: z.array(tenantMemberSchema),
  })
  .meta({
    id: 'TenantMembersOutput',
    description: 'Members of a tenant',
  })

export type TenantMembersOutput = z.infer<typeof tenantMembersOutputSchema>
