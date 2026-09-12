import {Module} from '@nestjs/common'

import {CompositionModule} from '@b2b-saas-starter-kit/composition'

import {CommonModule} from '../../common/common.module'

import {AuthController} from './auth.controller'
import {AuthService} from './auth.service'

@Module({
  imports: [CompositionModule, CommonModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
