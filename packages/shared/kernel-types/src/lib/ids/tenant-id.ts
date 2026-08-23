import {z} from 'zod'

import {BrandedId} from '../brand/branded-id'

export const TenantId = BrandedId.create('TenantId', z.uuid())
export type TenantId = z.infer<typeof TenantId.schema>
