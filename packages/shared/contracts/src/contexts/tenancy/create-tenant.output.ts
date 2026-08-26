import {z} from 'zod'

import {MembershipId, RoleId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

const createTenantRoleIdsSchema = z
  .object({
    owner: RoleId.schema,
    admin: RoleId.schema,
    member: RoleId.schema,
  })
  .meta({
    id: 'CreateTenantRoleIds',
    description: 'Seeded Owner, Admin, and Member role ids',
  })

export const createTenantOutputSchema = z
  .object({
    id: TenantId.schema,
    ownerMembershipId: MembershipId.schema,
    roleIds: createTenantRoleIdsSchema,
  })
  .meta({
    id: 'CreateTenantOutput',
    description: 'Created tenant, owner membership, and seeded role ids',
  })

export type CreateTenantOutput = z.infer<typeof createTenantOutputSchema>
