import {Module} from '@nestjs/common'

import {TypeOrmRoleRepository} from '@b2b-saas-starter-kit/postgres'

@Module({
  providers: [TypeOrmRoleRepository],
  exports: [TypeOrmRoleRepository],
})
export class AuthorizationModule {}
