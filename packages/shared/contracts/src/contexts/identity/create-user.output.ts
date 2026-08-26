import {z} from 'zod'

import {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export const createUserOutputSchema = z
  .object({
    id: UserId.schema,
  })
  .meta({
    id: 'CreateUserOutput',
    description: 'Created user id',
  })

export type CreateUserOutput = z.infer<typeof createUserOutputSchema>
