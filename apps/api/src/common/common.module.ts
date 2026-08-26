import {Module} from '@nestjs/common'
import {APP_INTERCEPTOR} from '@nestjs/core'

import {CompositionModule} from '@b2b-saas-starter-kit/composition'

import {DevPrincipalInterceptor} from './auth/dev-principal.interceptor'
import {RequirePermissionInterceptor} from './auth/require-permission.interceptor'
import {DevSeeder} from './seeding/dev-seeder'

@Module({
  imports: [CompositionModule],
  providers: [
    DevSeeder,
    {
      provide: APP_INTERCEPTOR,
      useClass: DevPrincipalInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequirePermissionInterceptor,
    },
  ],
})
export class CommonModule {}
