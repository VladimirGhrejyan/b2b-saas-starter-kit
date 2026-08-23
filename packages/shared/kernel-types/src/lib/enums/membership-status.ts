import type {z} from 'zod'

import {StringEnum} from '../brand/string-enum'

export const MembershipStatus = StringEnum.create(['invited', 'active', 'suspended'])
export type MembershipStatus = z.infer<typeof MembershipStatus.schema>
