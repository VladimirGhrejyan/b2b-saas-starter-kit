import {z} from 'zod'

import {BrandedId} from '../brand/branded-id'

export const MembershipId = BrandedId.create('MembershipId', z.uuid())
export type MembershipId = z.infer<typeof MembershipId.schema>
