import {Module} from '@nestjs/common'

import {ROLE_REPOSITORY} from '@b2b-saas-starter-kit/domain'

import {TypeOrmRoleRepository} from '@b2b-saas-starter-kit/postgres'

@Module({
  providers: [{provide: ROLE_REPOSITORY, useClass: TypeOrmRoleRepository}],
  exports: [ROLE_REPOSITORY],
})
export class AuthorizationModule {}
