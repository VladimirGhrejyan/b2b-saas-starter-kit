import {SetMetadata} from '@nestjs/common'

import type {ApiPermission} from '@b2b-saas-starter-kit/contracts'

import {REQUIRE_PERMISSION_KEY} from './require-permission-key'

export function RequirePermission(permission: ApiPermission) {
  return SetMetadata(REQUIRE_PERMISSION_KEY, permission)
}
