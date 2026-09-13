import {Module} from '@nestjs/common'
import {APP_INTERCEPTOR} from '@nestjs/core'

import {CompositionModule} from '@b2b-saas-starter-kit/composition'

import {AuthPrincipalInterceptor} from './auth/auth-principal.interceptor'
import {JwtAccessService} from './auth/jwt-access.service'
import {JWT_ACCESS_CONFIG} from './auth/jwt-access-config.token'
import {loadJwtAccessConfigFromEnv} from './auth/load-jwt-access-config'
import {RateLimitInterceptor} from './auth/rate-limit.interceptor'
import {RefreshCookie} from './auth/refresh-cookie'
import {RequirePermissionInterceptor} from './auth/require-permission.interceptor'
import {DevSeeder} from './seeding/dev-seeder'

@Module({
  imports: [CompositionModule],
  providers: [
    DevSeeder,
    {
      provide: JWT_ACCESS_CONFIG,
      useFactory: () => loadJwtAccessConfigFromEnv(),
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
  ],
  exports: [JwtAccessService, RefreshCookie],
})
export class CommonModule {}
