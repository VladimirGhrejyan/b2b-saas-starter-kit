import {z} from 'zod'

import {BrandedId} from '../brand/branded-id'

export const UserId = BrandedId.create('UserId', z.uuid())
export type UserId = z.infer<typeof UserId.schema>
