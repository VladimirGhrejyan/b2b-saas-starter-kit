import type {z} from 'zod'

import {StringEnum} from '../brand/string-enum'

export const TenantStatus = StringEnum.create(['active', 'suspended'])
export type TenantStatus = z.infer<typeof TenantStatus.schema>
