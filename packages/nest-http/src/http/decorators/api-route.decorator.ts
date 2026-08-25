import {applyDecorators, Delete, Get, Patch, Post, Put} from '@nestjs/common'
import {ApiOperation} from '@nestjs/swagger'

import {HttpMethod} from '@b2b-saas-starter-kit/contracts'

import type {RouteMetadata} from './route-metadata.types'

export function ApiRoute(meta: RouteMetadata) {
  const methodDecorator = {
    [HttpMethod.GET]: Get,
    [HttpMethod.POST]: Post,
    [HttpMethod.PUT]: Put,
    [HttpMethod.PATCH]: Patch,
    [HttpMethod.DELETE]: Delete,
  }[meta.method]

  return applyDecorators(
    methodDecorator(meta.path),
    ApiOperation({
      summary: meta.summary,
      operationId: meta.operationId,
      tags: meta.tags ? [...meta.tags] : undefined,
    }),
  )
}
