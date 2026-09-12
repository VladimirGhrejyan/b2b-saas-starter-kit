import {z} from 'zod'

import {BrandedId} from '../brand/branded-id'

export const RefreshSessionId = BrandedId.create('RefreshSessionId', z.uuid())
export type RefreshSessionId = z.infer<typeof RefreshSessionId.schema>
