import {z} from 'zod'

import {MembershipId, MembershipStatus, RoleId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

const tenantMemberUserSchema = z
  .object({
    email: z.email(),
    displayName: z.string(),
  })
  .meta({
    id: 'TenantMemberUser',
    description: 'User PII included when the actor has identity.users.read',
  })

const tenantMemberSchema = z
  .object({
    membershipId: MembershipId.schema,
    userId: UserId.schema,
    roleIds: z.array(RoleId.schema),
    status: MembershipStatus.schema,
    user: tenantMemberUserSchema.optional(),
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
