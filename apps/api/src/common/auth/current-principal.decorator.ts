import type {ExecutionContext} from '@nestjs/common'
import {createParamDecorator} from '@nestjs/common'

import type {DevPrincipal} from './dev-principal.types'
import type {DEV_PRINCIPAL_KEY} from './dev-principal-key'
import {readDevPrincipal} from './read-dev-principal'

export const CurrentPrincipal = createParamDecorator((_data: unknown, context: ExecutionContext): DevPrincipal => {
  const request = context.switchToHttp().getRequest<{[DEV_PRINCIPAL_KEY]?: DevPrincipal}>()

  return readDevPrincipal(request)
})
