import {Module} from '@nestjs/common'
import {APP_INTERCEPTOR} from '@nestjs/core'

import {HttpRequestInterceptor} from './interceptors/http-request.interceptor'

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpRequestInterceptor,
    },
  ],
})
export class HttpRequestModule {}
