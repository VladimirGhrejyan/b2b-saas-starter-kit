import type {Provider} from '@nestjs/common'
import {APP_FILTER, APP_INTERCEPTOR, APP_PIPE} from '@nestjs/core'

import {ApiExceptionFilter} from '../filters/api-exception.filter'
import {ApiSerializerInterceptor} from '../interceptors/api-serializer.interceptor'
import {ApiValidationPipe} from '../pipes/api-validation.pipe'

export function createHttpProviders(): Provider[] {
  return [
    {
      provide: APP_PIPE,
      useClass: ApiValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiSerializerInterceptor,
    },
  ]
}
