import {RequestMethod} from '@nestjs/common'
import {METHOD_METADATA, PATH_METADATA} from '@nestjs/common/constants'
import {describe, expect, it} from 'vitest'

import {HttpMethod} from '@b2b-saas-starter-kit/contracts'

import {ApiRoute} from './api-route.decorator'

describe('ApiRoute', () => {
  it('applies the HTTP method, path, and operation metadata', () => {
    class Probe {
      @ApiRoute({
        method: HttpMethod.GET,
        path: 'tenants',
        summary: 'List tenants',
        operationId: 'listTenants',
        tags: ['Tenants'],
      })
      list() {
        return []
      }
    }

    expect(Reflect.getMetadata(PATH_METADATA, Probe.prototype.list)).toBe('tenants')
    expect(Reflect.getMetadata(METHOD_METADATA, Probe.prototype.list)).toBe(RequestMethod.GET)
  })
})
