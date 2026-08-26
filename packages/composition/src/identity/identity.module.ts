import {Module} from '@nestjs/common'

import type {Clock, IdGenerator, UnitOfWork} from '@b2b-saas-starter-kit/platform'

import {CreateUserUseCase} from '@b2b-saas-starter-kit/application'

import {CLOCK, ID_GENERATOR, TypeOrmUserRepository, UNIT_OF_WORK} from '@b2b-saas-starter-kit/postgres'

@Module({
  providers: [
    TypeOrmUserRepository,
    {
      provide: CreateUserUseCase,
      useFactory: (uow: UnitOfWork, clock: Clock, ids: IdGenerator, users: TypeOrmUserRepository) =>
        new CreateUserUseCase(uow, clock, ids, users),
      inject: [UNIT_OF_WORK, CLOCK, ID_GENERATOR, TypeOrmUserRepository],
    },
  ],
  exports: [TypeOrmUserRepository, CreateUserUseCase],
})
export class IdentityModule {}
