import {z} from 'zod'

import {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export const registerUserOutputSchema = z
  .object({
    userId: UserId.schema,
  })
  .meta({
    id: 'RegisterUserOutput',
    description: 'Registered user id',
  })

export type RegisterUserOutput = z.infer<typeof registerUserOutputSchema>
