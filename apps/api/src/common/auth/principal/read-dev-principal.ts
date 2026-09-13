import {UnauthorizedException} from '@nestjs/common'

import type {DevPrincipal} from './dev-principal.types'
import {DEV_PRINCIPAL_KEY} from './dev-principal-key'

export function readDevPrincipal(request: {[DEV_PRINCIPAL_KEY]?: DevPrincipal}): DevPrincipal {
  const principal = request[DEV_PRINCIPAL_KEY]

  if (principal === undefined) {
    throw new UnauthorizedException('DevPrincipal is not established')
  }

  return principal
}
