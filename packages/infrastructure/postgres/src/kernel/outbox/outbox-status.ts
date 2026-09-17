import type {z} from 'zod'

import {StringEnum} from '@b2b-saas-starter-kit/shared-kernel-types'

export const OutboxStatus = StringEnum.create(['pending', 'processing', 'processed', 'failed'])
export type OutboxStatus = z.infer<typeof OutboxStatus.schema>
