import {z} from 'zod'

import {
  MembershipId,
  MembershipStatus,
  RoleId,
  TenantId,
  UserId,
  UserStatus,
} from '@b2b-saas-starter-kit/shared-kernel-types'

import {permissionSchema} from '../authorization/permission'

const meUserSchema = z
  .object({
    id: UserId.schema,
    email: z.email(),
    displayName: z.string(),
    status: UserStatus.schema,
  })
  .meta({
    id: 'MeUser',
    description: 'Authenticated user profile',
  })

const meMembershipSchema = z
  .object({
    membershipId: MembershipId.schema,
    tenantId: TenantId.schema,
    roleIds: z.array(RoleId.schema),
    status: MembershipStatus.schema,
  })
  .meta({
    id: 'MeMembership',
    description: 'Active membership in the current tenant',
  })

export const meOutputSchema = z
  .object({
    user: meUserSchema,
    membership: meMembershipSchema.nullable(),
    effectivePermissions: z.array(permissionSchema),
  })
  .meta({
    id: 'MeOutput',
    description: 'Current user, tenant membership, and effective permissions',
  })

export type MeOutput = z.infer<typeof meOutputSchema>
