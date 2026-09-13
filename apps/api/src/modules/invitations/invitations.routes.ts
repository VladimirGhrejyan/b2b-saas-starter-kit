import {HttpMethod} from '@b2b-saas-starter-kit/contracts'

import type {RouteMetadata} from '@b2b-saas-starter-kit/nest-http'

export const InvitationsRoutes = {
  invite: {
    method: HttpMethod.POST,
    path: 'tenants/:tenantId/invitations',
    summary: 'Invite a member by email',
    operationId: 'inviteMember',
    tags: ['invitations'],
  } satisfies RouteMetadata,
  accept: {
    method: HttpMethod.POST,
    path: 'invitations/accept',
    summary: 'Accept an invitation',
    operationId: 'acceptInvitation',
    tags: ['invitations'],
  } satisfies RouteMetadata,
}
