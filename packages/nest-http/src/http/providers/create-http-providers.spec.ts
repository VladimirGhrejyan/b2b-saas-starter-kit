import {APP_FILTER, APP_INTERCEPTOR, APP_PIPE} from '@nestjs/core'
import {describe, expect, it} from 'vitest'

import {ApiExceptionFilter} from '../filters/api-exception.filter'
import {ApiSerializerInterceptor} from '../interceptors/api-serializer.interceptor'
import {ApiValidationPipe} from '../pipes/api-validation.pipe'

import {createHttpProviders} from './create-http-providers'

describe('createHttpProviders', () => {
  it('registers kit pipe, exception filter, and serializer', () => {
    const providers = createHttpProviders()
    const filterProvider = providers[1] as {provide: unknown; useFactory: () => ApiExceptionFilter}

    expect(providers[0]).toEqual({provide: APP_PIPE, useClass: ApiValidationPipe})
    expect(filterProvider.provide).toBe(APP_FILTER)
    expect(filterProvider.useFactory()).toBeInstanceOf(ApiExceptionFilter)
    expect(providers[2]).toEqual({provide: APP_INTERCEPTOR, useClass: ApiSerializerInterceptor})
  })
})
