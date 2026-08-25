import {MembershipId, MembershipStatus, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Membership} from '@b2b-saas-starter-kit/domain'

import {MembershipEntity} from './membership.entity'
import {MembershipRoleEntity} from './membership-role.entity'

export const MembershipMapper = {
  toDomain(row: MembershipEntity): Membership {
    return Membership.reconstitute({
      id: MembershipId.parse(row.id),
      tenantId: TenantId.parse(row.tenantId),
      userId: UserId.parse(row.userId),
      roleIds: row.roleRows.map((roleRow) => RoleId.parse(roleRow.roleId)),
      status: MembershipStatus.parse(row.status),
    })
  },

  toEntity(membership: Membership): MembershipEntity {
    const row = new MembershipEntity()

    row.id = membership.id
    row.tenantId = membership.tenantId
    row.userId = membership.userId
    row.status = membership.status
    row.roleRows = membership.roleIds.map((roleId) => {
      const roleRow = new MembershipRoleEntity()

      roleRow.membershipId = membership.id
      roleRow.roleId = roleId

      return roleRow
    })

    return row
  },
}
