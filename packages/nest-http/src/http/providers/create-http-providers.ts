import type {Provider} from '@nestjs/common'
import {APP_FILTER, APP_INTERCEPTOR, APP_PIPE} from '@nestjs/core'

import {ApiExceptionFilter} from '../filters/api-exception.filter'
import {ApiSerializerInterceptor} from '../interceptors/api-serializer.interceptor'
import {ApiValidationPipe} from '../pipes/api-validation.pipe'

import type {CreateHttpProvidersOptions} from './create-http-providers.types'

export function createHttpProviders(options: CreateHttpProvidersOptions = {}): Provider[] {
  const codedErrorHttpStatuses = options.codedErrorHttpStatuses ?? {}

  return [
    {
      provide: APP_PIPE,
      useClass: ApiValidationPipe,
    },
    {
      provide: APP_FILTER,
      useFactory: () => new ApiExceptionFilter(codedErrorHttpStatuses),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiSerializerInterceptor,
    },
  ]
}
