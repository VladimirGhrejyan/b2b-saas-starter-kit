import {z} from 'zod'

import {BrandedId} from '../brand/branded-id'

export const RoleId = BrandedId.create('RoleId', z.uuid())
export type RoleId = z.infer<typeof RoleId.schema>
