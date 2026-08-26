import {SetMetadata} from '@nestjs/common'

import {TENANT_OPTIONAL_KEY} from './tenant-optional-key'

export function TenantOptional() {
  return SetMetadata(TENANT_OPTIONAL_KEY, true)
}
