import type {z} from 'zod'

import {StringEnum} from '@b2b-saas-starter-kit/shared-kernel-types'

export const IdempotencyRecordStatus = StringEnum.create(['processing', 'completed'])
export type IdempotencyRecordStatus = z.infer<typeof IdempotencyRecordStatus.schema>
