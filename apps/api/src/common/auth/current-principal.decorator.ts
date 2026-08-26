import type {ExecutionContext} from '@nestjs/common'
import {createParamDecorator} from '@nestjs/common'

import type {DevPrincipal} from './dev-principal.types'
import {DEV_PRINCIPAL_KEY} from './dev-principal-key'

export const CurrentPrincipal = createParamDecorator((_data: unknown, context: ExecutionContext): DevPrincipal => {
  const request = context.switchToHttp().getRequest<{[DEV_PRINCIPAL_KEY]?: DevPrincipal}>()
  const principal = request[DEV_PRINCIPAL_KEY]

  if (principal === undefined) {
    throw new Error('DevPrincipal is not established')
  }

  return principal
})
