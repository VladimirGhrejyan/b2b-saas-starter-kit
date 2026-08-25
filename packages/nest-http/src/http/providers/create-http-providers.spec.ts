import {APP_FILTER, APP_INTERCEPTOR, APP_PIPE} from '@nestjs/core'
import {describe, expect, it} from 'vitest'

import {ApiExceptionFilter} from '../filters/api-exception.filter'
import {ApiSerializerInterceptor} from '../interceptors/api-serializer.interceptor'
import {ApiValidationPipe} from '../pipes/api-validation.pipe'

import {createHttpProviders} from './create-http-providers'

describe('createHttpProviders', () => {
  it('registers kit pipe, exception filter, and serializer', () => {
    const providers = createHttpProviders()

    expect(providers).toEqual([
      {provide: APP_PIPE, useClass: ApiValidationPipe},
      {provide: APP_FILTER, useClass: ApiExceptionFilter},
      {provide: APP_INTERCEPTOR, useClass: ApiSerializerInterceptor},
    ])
  })
})
