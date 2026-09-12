import {z} from 'zod'

import {BrandedId} from '../brand/branded-id'

export const RefreshFamilyId = BrandedId.create('RefreshFamilyId', z.uuid())
export type RefreshFamilyId = z.infer<typeof RefreshFamilyId.schema>
