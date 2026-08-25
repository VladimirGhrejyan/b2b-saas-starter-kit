import {UserId, UserStatus} from '@b2b-saas-starter-kit/shared-kernel-types'

import {User} from '@b2b-saas-starter-kit/domain'

import {UserEntity} from './user.entity'

export const UserMapper = {
  toDomain(row: UserEntity): User {
    return User.reconstitute({
      id: UserId.parse(row.id),
      email: row.email,
      displayName: row.displayName,
      status: UserStatus.parse(row.status),
    })
  },

  toEntity(user: User): UserEntity {
    const row = new UserEntity()

    row.id = user.id
    row.email = user.email
    row.displayName = user.displayName
    row.status = user.status

    return row
  },
}
