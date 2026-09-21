import {Module} from '@nestjs/common'
import {APP_INTERCEPTOR} from '@nestjs/core'

import {CompositionModule} from '@b2b-saas-starter-kit/composition'

import {IdempotencyInterceptor} from '@b2b-saas-starter-kit/nest-http'

import {JwtAccessService} from './auth/jwt/jwt-access.service'
import {JWT_ACCESS_CONFIG} from './auth/jwt/jwt-access-config.token'
import {mapJwtAccessConfig} from './auth/jwt/map-jwt-access-config'
import {RequirePermissionInterceptor} from './auth/permission/require-permission.interceptor'
import {AuthPrincipalInterceptor} from './auth/principal/auth-principal.interceptor'
import {RateLimitInterceptor} from './auth/rate-limit/rate-limit.interceptor'
import {RefreshCookie} from './auth/refresh-cookie/refresh-cookie'
import type {ApiConfig} from './config/api-config.schema'
import {API_CONFIG} from './config/api-config.token'
import {DevSeeder} from './seeding/dev-seeder'

@Module({
  imports: [CompositionModule],
  providers: [
    DevSeeder,
    {
      provide: JWT_ACCESS_CONFIG,
      inject: [API_CONFIG],
      useFactory: (config: ApiConfig) => mapJwtAccessConfig(config),
    },
    JwtAccessService,
    RefreshCookie,
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuthPrincipalInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequirePermissionInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
  exports: [JwtAccessService, RefreshCookie],
})
export class CommonModule {}
