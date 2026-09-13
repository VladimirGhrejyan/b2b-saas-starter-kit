import {z} from 'zod'

import {BrandedId} from '../brand/branded-id'

export const InvitationId = BrandedId.create('InvitationId', z.uuid())
export type InvitationId = z.infer<typeof InvitationId.schema>
