import type {z} from 'zod'

import {StringEnum} from '../brand/string-enum'

export const UserStatus = StringEnum.create(['active', 'suspended'])
export type UserStatus = z.infer<typeof UserStatus.schema>
