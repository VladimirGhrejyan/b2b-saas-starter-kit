import type {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'
import type {TenantMembersOutput} from '@b2b-saas-starter-kit/contracts'

import type {ListTenantMembersQuery} from '@b2b-saas-starter-kit/composition'

export class TenantMembersMapper {
  static toQuery(tenantId: TenantId, actorId: UserId): Parameters<ListTenantMembersQuery['execute']>[0] {
    return {tenantId, actorId}
  }

  static toOutput(result: Awaited<ReturnType<ListTenantMembersQuery['execute']>>): TenantMembersOutput {
    return {
      members: result.members.map((member) => ({
        membershipId: member.membershipId,
        userId: member.userId,
        roleIds: [...member.roleIds],
        status: member.status,
      })),
    }
  }
}
