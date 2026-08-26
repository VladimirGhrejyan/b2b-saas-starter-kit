import type {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'
import type {MeOutput} from '@b2b-saas-starter-kit/contracts'
import {permissionSchema} from '@b2b-saas-starter-kit/contracts'

import type {GetMyProfileQuery} from '@b2b-saas-starter-kit/composition'

export class MeMapper {
  static toQuery(actorId: UserId, tenantId: TenantId): Parameters<GetMyProfileQuery['execute']>[0] {
    return {actorId, tenantId}
  }

  static toOutput(result: Awaited<ReturnType<GetMyProfileQuery['execute']>>): MeOutput {
    return {
      user: result.user,
      membership:
        result.membership === null
          ? null
          : {
              membershipId: result.membership.membershipId,
              tenantId: result.membership.tenantId,
              roleIds: [...result.membership.roleIds],
              status: result.membership.status,
            },
      effectivePermissions: result.effectivePermissions.map((permission) => permissionSchema.parse(permission)),
    }
  }
}
