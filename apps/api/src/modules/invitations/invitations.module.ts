import {Module} from '@nestjs/common'

import {CompositionModule} from '@b2b-saas-starter-kit/composition'

import {InvitationsController} from './invitations.controller'
import {InvitationsService} from './invitations.service'

@Module({
  imports: [CompositionModule],
  controllers: [InvitationsController],
  providers: [InvitationsService],
})
export class InvitationsModule {}
